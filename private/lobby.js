class Lobbies {
  constructor(){
    this.lobbies = {};
    this.words = [0,1,2,3,4,5,6,7,8,9];
  }
  createLobby(){
    let lobbyID = this.generateLobbyID();
    this.lobbies[lobbyID] = new Lobby(lobbyID);
    return this.lobbies[lobbyID];
  }
  getLobby(lobbyID){
    return this.lobbies[lobbyID]
  }
  generateLobbyID(len = 3){
    return Math.random().toString(36).substr(2, 4)
    // str = ""
    //  while(len > 0){
    //   nextWord = 
    //   str += nextWord;
    // }
    // return 
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

class Game{
  constructor(players,nPlaying){
    this.running = false;
    this.unassignedPlayers = [];
    this.liberals = [];
    this.fascists = [];
    this.hitler = undefined;
    this.nPlaying = players.length;
    this.currentPlayer = 0;
  }
  startGame(){
    this.running = true;
    this.assignRoles();
  }
  assignRoles(){
    /*
    PLAYERS | 5 | 6 | 7 | 8 | 9 | 10
    LIBERALS| 3 | 4 | 4 | 5 | 5 | 6
    FASCISTS| 2 | 2 | 3 | 3 | 4 | 4 (one of which is adolf);
    */
   nliberals = Math.ceil((this.nPlaying + 1)/2);
   nFascists = Math.floor((this.nplaying - 1)/2);

  }
}

function getObjectLength(obj){
  return Object.keys(obj).length;
}

module.exports = Lobbies;