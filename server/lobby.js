var Hitler = require('./Game/Hitler')
class Lobbies {
  constructor(io,Game){
    this.io = io;
    this.Game = Game;
    this.lobbies = {};
    this.words = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
   }
  createLobby(devMode=false){
    let lobbyID = this.generateLobbyID();
    this.lobbies[lobbyID] = new Lobby(this.io,lobbyID,devMode);
    return this.lobbies[lobbyID];
  }
  getLobby(lobbyID){
    return this.lobbies[lobbyID]
  }
  generateLobbyID(len = 2){
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
  constructor(io, lobbyID,devLobby = false, Game=Hitler,  min = 5, max = 10){
    let ourio = io.of("/"+lobbyID);
    this.ID = lobbyID
    this.io = io.of("/"+lobbyID);
    this.players = {}
    this.disconnectedPlayers = {}
    this.nextPID = 1;
    this.game = new Game(ourio, this.players, this);
    // this.chat = new Chat(ourio);
    this.nPlayers = 0;
    this.nConnected = 0; //We won't start if nConnected != nPlayers.
    this.MinPlayers = min;
    this.MaxPlayers = max;
    this.isDev = devLobby;
    this._sidpid = {}
    this.activateSignals();
  }

  error(message){
    this.log("ERROR! " + message);
  }
  log(message){
    let consoleMessage = "[" + this.ID + "]: " + message
    console.log(consoleMessage);
  }

  getNewPID(){
    let PID = this.nextPID;
    this.nextPID++;
    return PID;
    //Every player gets a player ID.
  }

  connectNewPlayer(username,socket){
    // Error checking
    let SID = socket.id
    if(this.nPlayers >= this.MaxPlayers || this.game.running){
      return false;
    }
    if(this._sidpid[SID] != undefined){
      this.error(`Player already connected with that Socket ID!`);
      return false
    }
    let PID = this.getNewPID()
    let player = new Player(username, PID, SID, socket);
    if(this.nPlayers == 0){
      player.isLeader = true;
    }
    this._sidpid[SID] = PID;
    this.players[PID] = player;
    this.nPlayers++;
    this.log(`${player.username} successfully connected and assigned PID=${PID} SID=${SID}`);
    //Update the Lobby
    //Let the player know their PID.
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
    this.log(`Player ${player.username} disconnected.}`);
    this.emitUpdateLobby();
  }

  reconnectPlayer(PID, socket){ 
    //Linking disconnected player PID to socket.
    if(!this.disconnectedPlayers[PID]){
      this.error("Reconnect: Player not in disconnected list! (were they kicked?)");
      return false;
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
    /*Because gamers are initialized when the game starts, sometimes games need to
    rerun initialization functions. */
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
    this.nPlayers--;
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
      publicPlayers[PID] = this.players[PID].getPublicInfo();
    }
    let args = {
      "lobbyID": this.ID,
      "players": publicPlayers,
      "gameInfo": gameInfo
    }
    return args
  }
  initializeGame(){
    if(this.nPlayers < this.MinPlayers && !this.isDev){
      return false; //Only condition to not play game
    }
    this.game.init();
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
      socket.on('request kick', (arg)=>{this.requestKick(arg.kickee,socket);});
      socket.on('rejoin lobby', (arg)=>{this.reconnectPlayer(arg.PID, socket)})
      socket.on('chat send msg', (arg)=>this.io.emit('chat recv msg', (arg)));
      socket.on('game init', ()=>this.initializeGame());
      // socket.on('activate game signals', ()=>this.game.activateGameSignals(socket));
      // if(this.game.running){
      //   this.game.activateGameSignals(socket);
      // }
    })
  }
}

class Player{
  constructor(username="definitelyLiberal", PID, SID, socket = null){
    this.username = username;
    this.isLeader = false;
    this.PID = PID;
    this.SID = SID;
    this.socket = socket;
    this.connected = true; //True by default, changes to false on disconnect.
  }
  getPublicInfo(){
    //publicInfo: the stuff that every player gets to know.
    //This should mostly be used for initializing the game.
    let arg = {"username": this.username, 
               "isLeader": this.isLeader, 
               "connected": this.connected,
               "PID": this.PID
              }
    return arg;
  }
}

// class Chat {
//   constructor(io){
//     io.on('chat send msg', (arg)=>{
//       console.log("Chat!");
//       io.emit('chat recv msg', (arg));
//     });
//   }
// }

//If i need to check the length of object.
function getObjectLength(obj){
  return Object.keys(obj).length;
}

module.exports = {Lobbies, Lobby, Player};