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
    let ourio = io.of("/"+lobbyID);
    this.ID = lobbyID
    this.io = io.of("/"+lobbyID);
    this.players = {}
    this.disconnectedPlayers = {}
    this.game = new Game(ourio, this.players);
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

  connectPlayer(username,PID,SID){
    if(this.nPlayers >= this.MaxPlayers || this.game.running){
      return false;
    }
    let player = new Player(username,PID,SID);
    if(this._sidpid[SID] != undefined){
      this.error(`Player already connected with that Socket ID!`);
      return false
    }
    //Reconnect the player if they are disconnected.
    //the username field is disregarded, as it will be unused.
    if(this.disconnectedPlayers[PID] != undefined){
      return this.reconnectPlayer(PID,PID,SID);
    }
    //If theres no players, this player becomes the lobby leader.
    if(this.nPlayers == 0){
      player.isLeader = true;
    }
    this._sidpid[SID] = PID;
    this.players[PID] = (player);
    this.nPlayers++;
    this.log(`${player.username} successfully connected with SID =  ${SID} PID = ${PID}`)
    // return player;
    let arg = {
      "you": player,
      "lobbyInfo": this.getLobbyInfo()
    }
    this.io.to(SID).emit('lobby joined', arg);
    this.io.emit('lobby update info', arg);
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
  
  getPlayer(PID){
    return this.players[PID];
  }
  disconnectPlayer(SID){ 
    //Disconnects a player by socket ID.
    //Disconnects occur when the player closes the lobby window. 
    //The only information we have on disconnect is the socketID.
    //If the game isn't running, then we want to skip disconnect logic and just kick.
    let PID = this._sidpid[SID];

    // if(!this.game.running){
    //   return this.kickPlayer(PID);
    // }
    //Unlink socketID to playerID.
    delete this._sidpid[SID];
    this.players[PID].SID = undefined;
    this.disconnectedPlayers[PID] = this.getPlayer(PID);
    this.players[PID].connected = false;
    this.nConnected--;

    this.log("nPlayers: " + this.nPlayers);
  }
  kickPlayer(PID){
    //Kicking != Disconnecting. 
    //Kicking completely gets rid of a user, as opposed to moving them to this.disconnected.
    //To be safe, kicking should work if a player has been disconnected already.
    let player = this.getPlayer(PID);
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
    this.io.to(SID).emit('kick');
    let arg = {
      "lobbyInfo": this.getLobbyInfo()
    }
    this.io.emit('lobby update info', arg)
    return true;
  }
  requestKick(SID, kickee){
    let player = this.getPlayerBySocketID(SID);
    if(player.isLeader){
      this.kickPlayer(kickee);
    }else{
      this.log("Kick request from non leader! Ignoring.")
    }
  }
  //Reconnects can occur when a player has disconnected but not been kicked.
  //This function:
    //Checks that the player we're connecting to is actually disconnected.
    //Handles changing a player's PID. Handles if the player is different.
    //TODO: use socket to send 
  reconnectPlayer(oldPID, PID, SID){ 
    if(!this.disconnectedPlayers[oldPID]){
      this.error("Reconnect: Player in disconnected list. (were they kicked?)");
      return false;
    }
    let player = this.disconnectedPlayers[oldPID];
    delete this.disconnectedPlayers[oldPID];
    this.nConnected++;
    //if a different computer is connecting
    if(PID != oldPID){
      //get rid of the old user.
      this.players[PID] = player
      delete this.players[oldPID];
      player.PID = PID; //PID
    }
    player.connected = true;
    let oldSID = player.SID;
    delete this._sidpid[oldSID];
    this._sidpid[SID] = PID
    player.SID = SID;
    this.log(`${player.username} reconnected with SID =  ${SID} PID = ${PID}`)
    let arg = {
      "you": player,
      "lobbyInfo": this.getLobbyInfo()
    }
    this.io.to(SID).emit('lobby joined', arg);
    this.io.emit('lobby update info', arg);
  }
  getLobbyInfo(){
    //Lobby info compiles some basic information about the lobby to be sent.
    let gameInfo = this.game.getGameInfo();
    let publicPlayers = [];
    for(var player of Object.values(this.players)){
      publicPlayers.push(player.getPublicInfo());
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
        this.log("Player disconnected");
        //If a player exists, then we need to disconnect him.
        if(this.getPlayerBySocketID(socket.id)){
          this.disconnectPlayer(socket.id);
        }
      })
      socket.on('user init request', ()=>socket.emit('lobby init info', this.getLobbyInfo()));
      socket.on('join lobby', (arg) => {this.connectPlayer(arg.username,arg.PID, socket.id)})
      socket.on('reconnect request', (arg)=>{this.reconnectPlayer(arg.oldPID, arg.PID, socket.id)})
      socket.on('request kick', (arg)=>{this.requestKick(socket.id,arg.kickee);});
      socket.on('chat send msg', (arg)=>this.io.emit('chat recv msg', (arg)));
    })
  }
}

class Player{
  constructor(username="definitelyLiberal",PID,SID){
    this.username = username;
    this.isLeader = false;
    this.PID = PID;
    this.SID = SID;
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

module.exports = Lobbies;