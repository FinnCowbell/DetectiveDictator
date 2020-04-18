var Hitler = require('./Hitler')
class Lobbies {
  constructor(io,Game){
    this.io = io
    this.Game = Game
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
    this.ID = lobbyID
    this.io = io.of("/"+lobbyID)
    this.players = {}
    this.disconnectedPlayers = {}
    this.game = new Game(this.io, this.players);
    this.nPlayers = 0;
    this.nConnected = 0; //We won't start if nConnected != nPlayers.
    this.MinPlayers = min;
    this.MaxPlayers = max;
    this.isDev = devLobby;
    this._sidpid = {}
    this.activateSignals();
  }
  connectPlayer(name,PID,SID){
    if(this.nPlayers >= this.MaxPlayers || this.game.running){
      return false;
    }
    let newPlayer = new Player(name,PID,SID);
    if(this.nPlayers == 0){
      newPlayer.isLeader = true;
    }
    if(this._sidpid[SID] != undefined){
      this.error("Player already connected with that Socket ID!");
      return false
    }
    this._sidpid[SID] = PID;
    this.players[PID] = (newPlayer);
    this.nPlayers++;
    this.log("nPlayers: " + this.nPlayers)
    let arg = {
      "player": newPlayer,

    }
    this.io.to(SID).emit('player joined', arg);
  }
  getPlayerBySocketID(SID){
    let player = this.players[this._sidpid[SID]];
    if(player[SID] != SID && player[SID]){
      this.error("Incorrect Player Returned by SID");
    }
    return player
  }
  getPlayer(PID){
    return this.players[PID];
  }
  disconnectPlayer(SID){ 
    //Disconnects a player by socket ID.
    let PID = this._sidpid[SID];
    //We no longer use this socket id.
    this._sidpid[SID] = undefined;
    this.disconnectedPlayers[PID] = this.players[PID];
    this.players[PID].connected = false;
    this.players[PID].SID = undefined;
    this.nConnected--;
    if(!this.game.running){
      this.kickPlayer(PID)
    }
    this.log("nPlayers: " + this.nPlayers);
  }
  reconnectPlayer(currentPID, PID, SID){ 
    //Handles changing a player's PID. Handles IF the player is different.
    //Checks that the player we're connecting to is actually disconnected.
    if(!this.disconnectPlayers[currentPID]){
      this.error("Reconnect Error! Player not disconnected.");
      return;
    }
    let player = this.disconnectedPlayers[currentPID];
    delete this.disconnectedPlayers[currentPID];
    this.nConnected++;
    if(PID != currentPID){
      this.players[PID] = player
      delete this.players[currentPID]; //Completely gets rid of unused player.
      player.PID = PID; //PID
    }
    player.connected = true;
    let oldSID = player.SID;
    this._sidpid[oldSID] = undefined;
    this._sidpid[SID] = PID
    player.SID = SID;
  }
  kickPlayer(PID){
    let player = this.getPlayer(PID);
    if(player == undefined){
      this.error("Kick Error! Player does not exist.");
      return false;
    }
    this.players[player.PID] = undefined
    if(player.connected){
      this.nConnected--;
    }
    this.nPlayers--;
    return true;
  }
  getLobbyInfo(){
    let args = {
      "lobbyID": this.ID,
      "gameRunning": this.game.running
    }
    return args
  }
  initializeGame(){
    if(this.nPlayers < this.MinPlayers && !this.isDev){
      return false; //Only condition to not play game
    }
    this.game.init();
  }
  error(message){
    this.log("Error! " + message);
  }
  log(message){
    let consoleMessage = "[" + this.ID + "]: " + message
    console.log(consoleMessage);
  }
  activateSignals(){
    this.io.on('connect', (socket)=>{
      this.log("Connected with SID:" + socket.id)
      socket.on('disconnect',()=>{
        if(this.getPlayerBySocketID(socket.id)){
          this.disconnectPlayer(socket.id);
        }
      })
      socket.on('join lobby', (arg) => {this.connectPlayer(arg.name,arg.PID, socket.id)})
      socket.emit('lobby found', this.getLobbyInfo());
    })
  }
}

class Player{
  contructor(name,PID,SID){
    this.name = name;
    this.isLeader = false;
    this.PID = PID;
    this.SID = SID;
    this.connected = true; //True by default, changes to false on disconnect.
  }
}

//If i need to check the length of object.
function getObjectLength(obj){
  return Object.keys(obj).length;
}

module.exports = Lobbies;