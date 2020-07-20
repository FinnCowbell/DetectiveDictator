var Hitler = require('./Game/Hitler')
class Lobbies {
  constructor(io,Game){
    this.io = io;
    this.idWordLength = 2;
    this.Game = Game;
    this.lobbies = {};
    this.words = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
   }
  createLobby(devMode=false){
    //LobbyID = what is printed. lobbyKey = an all-lowercase lobbyID.
    let lobbyID, lobbyKey, lobby, nLobbies, maxLobbies; 
    //If we're running out of words at our current length, increase the length.
    nLobbies = Object.keys(this.lobbies).length;
    maxLobbies = Math.pow(this.words.length, this.idWordLength);
    if(nLobbies >= maxLobbies - 1){
      this.idWordLength++;
    }
    //Confirms we dontt overwrite existing lobbies.
    do{
      lobbyID = this.generateLobbyID(this.idWordLength);
      lobbyKey = lobbyID.toLowerCase();
    } while(this.getLobby(lobbyKey));
    
    lobby = new Lobby(this.io,lobbyID,this,devMode, 1, Hitler, 5, 10 );
    this.lobbies[lobbyKey] = lobby;
    return this.lobbies[lobbyKey];
  }

  getLobby(lobbyID){
    return this.lobbies[lobbyID]
  }

  generateLobbyID(len = 3){
    let nextWord, str = ""
    while(len > 0){
      nextWord = this.words[Math.floor(Math.random()*this.words.length)];
      str += nextWord;
      len--;
    }
    return str
  }

}

class Lobby{
  constructor(io, lobbyID, lobbies, devMode = false, startingPID, Game=Hitler, min = 0, max = 100){
    let lobbyKey = lobbyID.toLowerCase();
    let ourio = io.of(`/${lobbyKey}`)
    this.ID = lobbyID;
    this.lobbies = lobbies;
    this.key = lobbyKey;
    this.io = ourio;
    this.players = {};
    this.leader = null;
    this.spectators = {};
    this.disconnectedPlayers = {};
    this._sidpid = {};
    this.nextPID = startingPID;
    this.game = new Game(ourio, devMode, this.players, this);
    this.nPlayers = 0;
    this.nConnected = 0; //We won't start if nConnected != nPlayers.
    this.MinPlayers = min;
    this.MaxPlayers = max;
    this.devMode = devMode;
    this.activateSignals();
    this.log("Lobby Created");
    this.nextLobbyID = null
  }
  error(message){
    this.log("<ERROR> " + message);
    return -1;
  }
  log(message){
    //If an object is sent, allow the object to be printed.
    if(typeof message == 'string'){
      let consoleMessage = "[" + this.ID + "]: " + message
      console.log(consoleMessage);
    } else{
      console.log(`[${this.ID}]:`);
      console.log(message)
      console.log(`_________`);
    }
  }
  activateSignals(){
    this.io.on('connect', (socket)=>{
      this.log("Connected with SID:" + socket.id)
      socket.on('disconnect',()=>{
        //If the player was in the lobby, then we need to disconnect him.
        if(this.getPlayerBySocketID(socket.id)){
          this.disconnectPlayer(socket);
        }
      })
      socket.on('connection init request', ()=>socket.emit('lobby init info', {initInfo: this.getLobbyInfo()}));
      socket.on('join lobby', (arg) => {this.connectNewPlayer(arg.username, socket)})
      socket.on('spectator init', ()=>{this.connectNewPlayer('SPECTATOR', socket, true)})
      socket.on('request kick', (arg)=>{this.requestKick(arg.kickee,socket);});
      socket.on('rejoin lobby', (arg)=>{this.reconnectPlayer(arg.PID, socket)})
      socket.on('chat send msg', (arg)=>this.io.emit('chat recv msg', (arg)));
      socket.on('game init', ()=>this.initializeGame(socket));
      socket.on('join new lobby', ()=>this.joinNextLobby(socket));
    })
  }
  getNewPID(){
    let PID = this.nextPID;
    this.nextPID++;
    return PID;
    //Every player gets a player ID.
  }
  connectNewPlayer(username,socket,spectating = false){
    // Error checking
    let SID = socket.id;
    if(this.nPlayers >= this.MaxPlayers && spectating == false){
      socket.emit('alert', "Lobby is Full!");
      return false;
    }
    if(this._sidpid[SID] != undefined){
      this.error(`Player already connected with that Socket ID!`);
      return false
    }
    let PID = this.getNewPID()
    let player = new Player(username, PID, SID, socket);

    if(this.leader === null && !spectating){
      player.isLeader = true;
      this.leader = player;
    }
    this._sidpid[SID] = PID;
    this.players[PID] = player;
    if(spectating){
      player.isSpectating = true;
      this.spectators[PID] = player;
      if(this.game.initSpectator && this.game.running){
        this.game.initSpectator(socket);
      }
    } else{
      this.nPlayers++;
      this.log(`${player.username} successfully connected and assigned PID=${PID} SID=${SID}`);
      //Update the Lobby
      //Let the player know their PID.
    }
    socket.emit('lobby joined', {PID: PID})
    this.emitUpdateLobby();
  }

  disconnectPlayer(socket){
    //Disconnects a player by socket.
    //Disconnects occur when the player closes the lobby window. 
    //The only information we have on disconnect is the socket.
    //If the game isn't running, disconnects should kick the player.
    let SID = socket.id;
    let player = this.getPlayerBySocketID(socket.id);
    let PID = player.PID;
    //Should this logic be elsewhere?
    if(!this.game.running){
      return this.kickPlayer(PID);
    }
    // Unlink socketID to playerID.
    //We're not using this socket ID again, so we want to get rid of it.
    delete this._sidpid[socket.id];
    player.socket = null;
    player.SID = null;
    this.disconnectedPlayers[PID] = this.players[PID];
    player.connected = false;
    this.nConnected--;
    this.log(`Player ${player.username} disconnected.`);
    this.emitUpdateLobby();
  }

  reconnectPlayer(PID, socket){ 
    //Linking disconnected player PID to socket.
    if(!this.disconnectedPlayers[PID]){
      return this.error("Reconnect: Player not in disconnected list! (were they kicked?)");
    }
    let SID = socket.id
    let player = this.disconnectedPlayers[PID];
    delete this.disconnectedPlayers[PID];
    this._sidpid[SID] = PID
    player.socket = socket;
    player.SID = socket.id;
    player.connected = true;
    this.nConnected++;
    this.log(`${player.username} and PID ${PID} reconnected with SID = ${SID}`)

    //If the game's running and the game handles reconnecting, 
    if(this.game.reconnectPlayer && this.game.running){
      this.game.reconnectPlayer(socket);
    }
    let arg = {
      "PID": PID
    }
    socket.emit('lobby joined', arg);
    this.emitUpdateLobby();
  }

  getPlayerBySocketID(SID){
    let player = this.players[this._sidpid[SID]];
    if(!player){
      return false;
    }
    //A quick check to confirm all data is updated.
    if(player[SID] != SID && player[SID]){
      this.error("Incorrect Player Returned by SID");
    }
    return player
  } 

  kickPlayer(PID){
    //Kicking != Disconnecting. 
    //Kicking completely gets rid of a user, as opposed to moving them to this.disconnected.
    //To be safe, kicking should work if a player has been disconnected already.
    let player = this.players[PID];
    if(player == undefined){
      this.error("Kick: Player does not exist.");
      return false;
    }
    let SID = player.SID;
    delete this._sidpid[SID];
    delete this.players[PID];
    if(player.connected){
      this.nConnected--;
    }else{
      delete this.disconnectedPlayers[PID];
    }
    if(player.isLeader){
      this.leader = null;
    }
    if(!player.isSpectating){
      this.nPlayers--;
    }
    this.log(`Player ${player.username} kicked from the lobby.`)
    player.socket.emit('kick');
    this.emitUpdateLobby();
    return true;
  }
  requestKick(kickeePID, socket){
    let player = this.getPlayerBySocketID(socket.id);
    if(player.isLeader){
      this.kickPlayer(kickeePID);
    }else{
      this.log("Kick request from non leader! Ignoring.")
    }
  }
  emitUpdateLobby(){
    //Emits that a lobby update has occurred.
    //Should run when players connect, disconnect, reconnect, ETC.
    let arg = {
      "lobbyInfo": this.getLobbyInfo()
    }
    this.io.emit('lobby update info', arg);
  }
  getLobbyInfo(){
    //Lobby info compiles some basic information about the lobby to be sent.
    let gameInfo = this.game.getLobbyGameInfo();
    let publicPlayers = {};
    for(var PID in this.players){
      if(!this.players[PID].isSpectating){
        publicPlayers[PID] = this.players[PID].getPublicInfo();
      }
    }
    let args = {
      "lobbyID": this.ID,
      "players": publicPlayers,
      "gameInfo": gameInfo,
      "nSpectators": Object.keys(this.spectators).length
    }
    return args
  }
  initializeGame(socket){
    if(this.nPlayers < this.MinPlayers && !this.devMode){
      socket.emit('alert', `You need at least ${this.MinPlayers} to play.`);
      return false; //Only condition to not play game
    } else if(!this.getPlayerBySocketID(socket.id).isLeader){
      socket.emit('alert', "You cannot start the game!");
      return false;
    }

    this.game.init();
  }
  joinNextLobby(socket){
    if(this.nextLobbyID == null){
      let lobby = this.lobbies.createLobby(this.devMode);
      this.nextLobbyID = lobby.ID;
    }
    socket.emit('change lobby',{ID: this.nextLobbyID})
  }
}

class Player{
  constructor(username="definitelyLiberal", PID, SID, socket = null){
    this.username = username;
    this.isLeader = false;
    this.isSpectating = false;
    this.PID = PID;
    this.SID = SID;
    this.socket = socket;
    this.connected = true; //Changes to false on disconnect.
  }
  getPublicInfo(){
    //publicInfo: the stuff that every player gets to know.
    //This should mostly be used for initializing the game.
    let arg = {"username": this.username, 
               "isLeader": this.isLeader, 
               "isSpectating": this.isSpectating,
               "connected": this.connected,
               "PID": this.PID
              }
    return arg;
  }
}

module.exports = {Lobbies, Lobby, Player};