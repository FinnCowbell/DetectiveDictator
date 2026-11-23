const crypto = require("crypto");

const MAX_LOBBIES = 1000;
const MAX_USERNAME_LENGTH = 24;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const EMPTY_LOBBY_TTL_MS = 30 * 60 * 1000;

class Lobbies {
  constructor(io, devMode = false, ...GameModules) {
    this.io = io;
    this.idWordLength = 2;
    this.GameModules = GameModules;
    this.devMode = devMode;
    this.lobbies = {};
    this.words = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
    setInterval(() => this.sweepEmptyLobbies(), SWEEP_INTERVAL_MS).unref();
  }
  createLobby() {
    //LobbyID = what is printed. lobbyKey = an all-lowercase lobbyID.
    let lobbyID, lobbyKey, lobby, nLobbies, maxLobbies;
    //If we're running out of words at our current length, increase the length.
    nLobbies = Object.keys(this.lobbies).length;
    if (nLobbies >= MAX_LOBBIES) {
      console.error(`Lobby limit (${MAX_LOBBIES}) reached; refusing to create another.`);
      return null;
    }
    maxLobbies = Math.pow(this.words.length, this.idWordLength);
    if (nLobbies >= maxLobbies - 1) {
      this.idWordLength++;
    }
    //Confirms we dont overwrite existing lobbies.
    do {
      lobbyID = this.generateLobbyID(this.idWordLength);
      lobbyKey = lobbyID.toLowerCase();
    } while (this.getLobby(lobbyKey));

    lobby = new Lobby(lobbyID, this, ...this.GameModules);
    this.lobbies[lobbyKey] = lobby;
    return this.lobbies[lobbyKey];
  }

  getLobby(lobbyID) {
    return this.lobbies[lobbyID];
  }

  sweepEmptyLobbies(now = Date.now()) {
    for (const [key, lobby] of Object.entries(this.lobbies)) {
      if (lobby.io.sockets.size > 0) {
        lobby.emptySince = null;
      } else if (lobby.emptySince === null) {
        lobby.emptySince = now;
      } else if (now - lobby.emptySince >= EMPTY_LOBBY_TTL_MS) {
        lobby.close();
        delete this.lobbies[key];
      }
    }
  }

  generateLobbyID(len = 3) {
    let nextWord,
      str = "";
    while (len > 0) {
      nextWord = this.words[Math.floor(Math.random() * this.words.length)];
      str += nextWord;
      len--;
    }
    return str;
  }
}

class Lobby {
  constructor(lobbyID, lobbies, ...GameModules) {
    let ourio = lobbies.io.of(`/${lobbyID.toLowerCase()}`);

    this.lobbies = lobbies;
    this.io = ourio;
    this.ID = lobbyID;
    this.nextLobbyID = null;
    this.key = lobbyID.toLowerCase();
    this.leader = null;
    this.players = {};
    this.spectators = {};
    this.disconnectedPlayers = {};
    this._sidpid = {};
    // Secret per seated player, required to reclaim a seat. Kept off Player so it never rides along in player info.
    this._rejoinTokens = new Map();
    this.emptySince = null;
    this.nextPID = 1;
    this.nPlayers = 0;
    this.nConnected = 0; //We won't start if nConnected != nPlayers.
    this.devMode = this.lobbies.devMode;
    this.activateSignals();

    //Generate the Game Modules.
    let gameModules = [];
    GameModules.forEach((m) => gameModules.push(new m(this)));
    gameModules.forEach((m) => m.prototypeModuleInfo(Player));
    this.game = gameModules[0];
    this.gameModules = gameModules;
    this.MIN_PLAYERS = gameModules[0].MIN_PLAYERS;
    this.MAX_PLAYERS = gameModules[0].MAX_PLAYERS;

    this.log("Lobby Created");
  }
  close() {
    this.io.disconnectSockets(true);
    this.io.removeAllListeners();
    // socket.io has no public API to drop a namespace; this mirrors its own cleanupEmptyChildNamespaces.
    this.lobbies.io._nsps.delete(this.io.name);
    this.log("Lobby closed after sitting empty");
  }
  error(message) {
    this.log("<ERROR> " + message);
    return -1;
  }
  log(message) {
    //If an object is sent, allow the object to be printed.
    if (typeof message == "string") {
      let consoleMessage = "[" + this.ID + "]: " + message;
      console.log(consoleMessage);
    } else {
      console.log(`[${this.ID}]:`);
      console.log(message);
      console.log(`_________`);
    }
  }
  activateSignals() {
    this.io.on("connect", (socket) => {
      this.log("Connection with SID: " + socket.id);
      socket.on("disconnect", () => {
        //If the player was in the lobby, then we need to disconnect him.
        if (this.getPlayerBySocketID(socket.id)) {
          this.disconnectPlayer(socket);
        }
      });
      socket.on("connection init request", () => this.emitUpdateLobby(socket));
      socket.on("join lobby", (arg) => {
        this.connectNewPlayer(arg?.username, socket);
      });
      socket.on("spectator init", () => {
        this.connectSpectator(socket);
      });
      socket.on("request kick", (arg) => {
        this.requestKick(arg?.kickee, socket);
      });
      socket.on("rejoin lobby", (arg) => {
        this.reconnectPlayer(arg?.PID, arg?.token, socket);
      });
      socket.on("game init", () => this.startGame(socket));
      socket.on("join new lobby", () => this.joinNextLobby(socket));
    });
  }
  getNewPID() {
    let PID = this.nextPID;
    this.nextPID++;
    return PID;
    //Every player gets a unique numeric ID.
  }

  connectSpectator(socket) {
    //Might overlap with connectNewPlayer too much
    if (this._sidpid[socket.id] != undefined) {
      this.error(`Player already connected with that Socket ID!`);
      return false;
    }
    let PID = this.getNewPID();
    let spectator = new Player(`Spectator${PID}`, PID, socket);
    this._sidpid[socket.id] = PID;
    spectator.isSpectating = true;
    this.players[PID] = spectator;
    this.spectators[PID] = spectator;
    this.log(`${spectator.username} joined lobby and assigned PID=${PID}`);
    this.gameModules.forEach((m) => m.connectSpectator(spectator));
    this.emitUpdateLobby();
    socket.emit("lobby joined", { PID: PID, isSpectating: true });
  }

  connectNewPlayer(username, socket) {
    username = typeof username == "string" ? username.trim() : "";
    if (!username || username.length > MAX_USERNAME_LENGTH) {
      socket.emit("alert", `Names must be 1-${MAX_USERNAME_LENGTH} characters.`);
      return false;
    }
    if (this.nPlayers >= this.MAX_PLAYERS) {
      this.log(this.nPlayers);
      socket.emit("alert", "Lobby is Full!");
      return false;
    }
    if (this._sidpid[socket.id] != undefined) {
      this.error(`Player already connected with that Socket ID!`);
      return false;
    }
    let PID = this.getNewPID();
    let player = new Player(username, PID, socket);

    if (this.leader === null) {
      player.isLeader = true;
      this.leader = player;
    }
    this._sidpid[socket.id] = PID;
    this.players[PID] = player;
    const token = crypto.randomBytes(16).toString("hex");
    this._rejoinTokens.set(PID, token);

    this.nPlayers++;
    this.log(`${player.username} joined lobby and assigned PID=${PID}`);
    this.gameModules.forEach((m) => m.connectNewPlayer(player));
    this.emitUpdateLobby();
    socket.emit("lobby joined", { PID: PID, isSpectating: false, token });
  }

  disconnectPlayer(socket) {
    //Disconnects a player by socket.
    //Disconnects occur when the player closes the window, loses connection, etc.
    //The only information we have on disconnect is the socket.
    //If the game isn't running, disconnects should just kick the player.
    let player = this.getPlayerBySocketID(socket.id);
    let PID = player.PID;
    // We inform the player they were  disconnected explicitly so they can initiate necessary game reconnect signals.
    player.socket.emit("connection_lost");
    // Unlink socketID to playerID.
    //We're not using this socket ID again, so we want to get rid of it.
    delete this._sidpid[socket.id];
    player.socket = null;
    player.connected = false;
    this.log(`Player ${player.username} disconnected.`);
    if (!player.isSpectating) {
      this.disconnectedPlayers[PID] = this.players[PID];
      this.nConnected--;
    } else {
      this.disconnectedPlayers[PID] = this.spectators[PID];
      delete this.spectators[PID]
    }
    this.emitUpdateLobby();
    this.gameModules.forEach((m) => m.disconnectPlayer(player));

  }

  reconnectPlayer(PID, token, socket) {
    //Linking disconnected player PID to socket.
    if (this._sidpid[socket.id] != undefined) {
      return this.error("Socket tried to rejoin while already holding a seat.");
    }
    if (!this.disconnectedPlayers[PID]) {
      this.error(
        "Player tried reconnecting, but not in disconnected list!"
      );
      this.error(`PID: ${PID}`);
      this.log(this.disconnectedPlayers);
      return -1
    }
    let player = this.disconnectedPlayers[PID];
    if (!player.isSpectating && !this.isRejoinToken(PID, token)) {
      return this.error(`Rejected rejoin for PID ${PID}: bad token.`);
    }
    delete this.disconnectedPlayers[PID];
    if (player.isSpectating) {
      this.spectators[PID] = player;
    }
    this._sidpid[socket.id] = PID;
    player.socket = socket;
    player.connected = true;
    this.nConnected++;
    this.log(`${player.username} and PID ${PID} reconnected.`);

    //Reconnect all the gameModules
    this.gameModules.forEach((m) => m.reconnectPlayer(player));

    socket.emit("lobby joined", {
      PID: PID,
      isSpectating: player.isSpectating,
      token: this._rejoinTokens.get(PID),
    });
    this.emitUpdateLobby();
  }

  isRejoinToken(PID, token) {
    const expected = this._rejoinTokens.get(PID);
    if (typeof token != "string" || !expected || token.length != expected.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  }

  getPlayerBySocketID(SID) {
    let player = this.players[this._sidpid[SID]];
    if (!player) {
      return false;
    }
    //A quick check to confirm all data is updated and linked correctly.
    if (player[SID] && player[SID].socket.id != SID) {
      this.error("Incorrect Player Returned by SID");
    }
    return player;
  }

  kickPlayer(PID) {
    //Kicking != Disconnecting.
    //Kicking completely gets rid of a user, as opposed to moving them to this.disconnected.
    //To be safe, kicking should also work if a player has been disconnected already.
    let player = this.players[PID];
    if (player == undefined) {
      this.error("Kick: Player does not exist.");
      return false;
    }
    let SID = player.socket?.id;
    delete this._sidpid[SID];
    delete this.players[PID];
    this._rejoinTokens.delete(PID);
    if (player.connected) {
      this.nConnected--;
    } else {
      delete this.disconnectedPlayers[PID];
    }
    if (player.isLeader) {
      this.leader = null;
    }
    if (player.isSpectating) {
      delete this.spectators[PID];
    } else {
      this.nPlayers--;
    }
    this.log(`Player ${player.username} kicked from the lobby.`);
    player.socket?.emit("kick");
    this.emitUpdateLobby();
    return true;
  }

  requestKick(kickeePID, socket) {
    let player = this.getPlayerBySocketID(socket.id);
    let kickee = this.players[kickeePID];
    if (kickee && !kickee.isSpectating && this.game.gameStatus == "ingame") {
      // The game holds this player's seat in its turn order; removing it mid-game breaks every later round.
      socket.emit("alert", "Players can't be kicked during a game.");
    } else if (player.isLeader) {
      this.kickPlayer(kickeePID);
    } else {
      this.log("Kick request from non leader! Ignoring.");
    }
  }
  emitUpdateLobby(socket = null) {
    if (socket !== null) {
      socket.emit("lobby update info", { lobbyInfo: this.getLobbyInfo() });
    } else {
      //Emits that a lobby update has occurred.
      //Should run when players connect, disconnect, reconnect, ETC.
      this.io.emit("lobby update info", { lobbyInfo: this.getLobbyInfo() });
    }
  }
  getLobbyInfo() {
    //Lobby info compiles some basic information about the lobby to be sent.
    let publicPlayers = {};
    Object.values(this.players)
      .filter((p) => !p.isSpectating)
      .forEach((p) => {
        publicPlayers[p.PID] = p.getLobbyInfo();
      });

    let args = {
      lobbyID: this.ID,
      players: publicPlayers,
      gameInfo: {
        //FIX This
        gameStatus: this.game.gameStatus,
      },
      nSpectators: Object.keys(this.spectators).length,
    };
    return args;
  }
  startGame(socket) {
    if (this.nPlayers < this.MIN_PLAYERS && !this.devMode) {
      socket.emit("alert", `You need at least ${this.MIN_PLAYERS} to play.`);
      return false; //Only condition to not play game
    } else if (!this.getPlayerBySocketID(socket.id).isLeader) {
      socket.emit("alert", "You cannot start the game!");
      return false;
      // no players can be disconnected
    }
    this.gameModules.forEach((m) => m.init());
  }
  joinNextLobby(socket) {
    if (this.nextLobbyID == null) {
      let lobby = this.lobbies.createLobby();
      if (!lobby) {
        socket.emit("alert", "The server is full right now. Try again later!");
        return;
      }
      this.nextLobbyID = lobby.ID;
    }
    socket.emit("change lobby", { ID: this.nextLobbyID });
  }
}

class Player {
  constructor(username, PID, socket = null) {
    this.socket = socket;
    this.username = username;
    this.PID = PID;
    this.isLeader = false;
    this.isSpectating = false;
    this.connected = true;
  }
  getLobbyInfo() {
    //Grabs the information only the lobby uses.
    let { username, isLeader, isSpectating, connected, PID } = { ...this };
    return { username, isLeader, isSpectating, connected, PID };
  }
  getInfo() {
    //Removes socket, but keeps everything else.
    return { ...this, socket: undefined };
  }
}

module.exports = { Lobbies, Lobby, Player };
