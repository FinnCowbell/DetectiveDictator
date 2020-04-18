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
    this.game = new Game();
    this.nPlayers = 0;
    this.nConnected = 0; //We won't start if nConnected != nPlayers.
    this.MinPlayers = min;
    this.MaxPlayers = max;
    this.isDev = devLobby;
    this._sidpid = {}
    this.activateSignals();
  }
  connectPlayer(name,SID,PID){
    if(this.nPlayers >= this.MaxPlayers){
      return false;
    }
    let newPlayer = new Player(name,PID);
    if(this.nPlayers == 0){
      newPlayer.isLeader = true;
    }
    // if(this._sidpid[SID] != undefined){
    //   console.log("error! Player already exists!");
    //   return false
    // }
    this._sidpid[SID] = PID;
    this.players[PID] = (newPlayer);
    this.nPlayers++;
    console.log("nPlayers: " + this.nPlayers)
    return newPlayer;
  }
  getPlayerBySocketID(SID){
    return this.players[this._sidpid[SID]];
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
    this.nConnected--;
    if(!this.game.running){
      this.kickPlayer()
    }
    console.log("nPlayers: " + this.nPlayers)
  }
  reconnectPlayer(currentPID, PID){ 
    //Handles changing a player's PID. Handles IF the player is different.
    //Checks that the player we're connecting to is actually disconnected.
    if(!this.disconnectPlayers[currentPID]){
      console.log("Reconnect Error! Player not disconnected.");
      return;
    }
    this.disconnectedPlayers[currentPID] = undefined;
    this.nConnected++;
    if(PID != currentPID){
      this.players[PID] = this.players[currentPID];
      this.players[PID].connected = true;
      this.players[PID].PID = PID; //PID
    }else{
      this.players[PID].connected = true;
    }
  }
  kickPlayer(PID){
    let player = this.getPlayer(PID);
    if(player == undefined){
      console.log("Kick Error! Player does not exist.");
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
    this.game = Game(this.players);
    return this.game;
  }
  activateSignals(){
    this.io.on('connect', (socket)=>{
      socket.on('disconnect',()=>{
        if(this.getPlayerBySocketID(socket.ID)){
          this.disconnectPlayer(socket.ID);
        }
      })
      socket.on('join lobby', (name, PID) => {this.connectPlayer(name,socket.ID,PID)})
      socket.emit('lobby found', this.getLobbyInfo());
    })
  }
}

class Player{
  contructor(name,PID){
    this.name = name;
    this.isLeader = false;
    this.PID = PID;
    this.connected = true; //True by default, changes to false on disconnect.
    this.alive = true;
    //If 0, liberal. If 1, Fascist. If 2, Hitler. -1 is unassigned/spectating (?)
    //When checking a party membership card, just do if(secret). false = liberal, true = fascist.
    this.membership = -1;
  }
}

//If i need to check the length of object.
function getObjectLength(obj){
  return Object.keys(obj).length;
}

module.exports = Lobbies;