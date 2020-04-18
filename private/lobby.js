Game = require('./game');
class Lobbies {
  constructor(){
    this.lobbies = {};
    this.words = [0,1,2,3,4,5,6,7,8,9];
  }
  createLobby(devMode=false){
    let lobbyID = this.generateLobbyID();
    this.lobbies[lobbyID] = new Lobby(lobbyID,devMode);
    return this.lobbies[lobbyID];
  }
  getLobby(lobbyID){
    return this.lobbies[lobbyID]
  }
  generateLobbyID(len = 1){
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
  constructor(lobbyID,devLobby = false){
    this.ID = lobbyID
    this.players = {}
    this.disconnectedPlayers = {}
    this.game = undefined;
    this.nPlayers = 0;
    this.nConnected = 0; //We won't start if nConnected != nPlayers.
    this.MinPlayers = 5;
    this.MaxPlayers = 10;
    this.isDev = devLobby;
  }
  addNewPlayer(name,PID){
    if(this.nPlayers >= this.MaxPlayers){
      return false;
    }
    newPlayer = Player(name,PID);
    this.players[PID] = (newPlayer);
    this.nPlayers++;
    return newPlayer;
  }
  initializeGame(){
    if(this.nConnected < this.MinPlayers && !this.isDev){
      return false; //Only condition to not play game
    }
    this.game = Game(this.players);
    return this.game;
  }
  disconnectPlayer(PID){
    this.disconnectedPlayers[PID] = this.players[PID];
    this.players[PID].connected = false;
    this.nConnected--;
  }
  reconnectPlayer(player, PID){ 
    //Handles changing a player's PID. Handles IF the player is different.
    //Checks that the player we're connecting to is actually disconnected.
    if(!this.disconnectPlayers[player.PID]){
      console.log("Reconnect Error! Player not disconnected.");
      return;
    }
    this.disconnectedPlayers[player.PID] = undefined;
    this.nConnected++;
    if(PID != player.PID){
      this.players[PID] = this.players[player.PID];
      this.players[PID].connected = true;
      this.players[PID].PID = PID; //PID
    }else{
      this.players[PID].connected = true;
    }
  }
  kickPlayer(player){
    if(this.players[player.PID] == undefined){
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