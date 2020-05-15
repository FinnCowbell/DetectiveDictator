var CardDeck = require('./CardDeck');
var {Lobbies, Lobby, Player} = require('../Lobby')
//Generally: 0 = Liberal, >0 = Fascist.
class Hitler{
  constructor(io, players, lobby){
    this.lobby = lobby; //Remove this if possible.
    this.running = false;
    this.io = io;
    this.players = players;
    this.order = []; //Order of players by PID.
    this.currentPlayer = 0;
    this.liberals = [];
    this.fascists = [];
    this.hitler = null;
    this.presidentPID = null; 
    this.chancellorPID = null;
    this.previousPresPID = null;
    this.previousChanPID = null;
    this.currentEvent = "pre game";
    this.fasBoard = 0; //0-6
    this.libBoard = 0; //0-6
    this.marker = 0; //0-3. If it turns to 3 it should be set to 0.
    this.nPlaying = 0;
    this.nAlive = 0;
    this.gameStyle = -1; // 0 is 5-6 players, 1 is 7-8, 2 is 9-10
    this.policies = new CardDeck([0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1], true, true);;
    this.rounds = [];
  }
  error(msg){
    console.log('Game Error! ' + msg);
  }
  init(){
    this.initPlayers();
    this.policies.shuffleCards();
    this.running = true;
    //Let the lobby know the game is starting. Send the game info to the lobby.
    this.io.emit('lobby game starting', {gameInfo: this.getLobbyGameInfo()});
    this.newRound();
  }
  initPlayers(){
    //Adds the alive and membership attributes to each player.
    let PID;
    for(PID in this.players){ 
      let player = this.players[PID];
      player.alive = true;
      //If 0, liberal. If 1, Fascist. If 2, Hitler. -1 is unassigned/spectating (?)
      player.membership = -1;
      this.nPlaying++; //reCalculate player count.
      this.nAlive++;
      this.order.push(PID);
      this.assignRoles();
    }
    if(this.nPlaying <= 6){
      this.gameStyle = 0;
    } else if(this.nPlayer == 7 ||  this.nPlayers == 8){
      this.gameStyle = 1;
    } else{
      this.gameStyle = 2;
    }
    shuffle(this.order); //Shuffle the order of players.
  }
  assignRoles(){
    // PLAYERS | 5 | 6 | 7 | 8 | 9 | 10
    // LIBERALS| 3 | 4 | 4 | 5 | 5 | 6
    // FASCISTS| 2 | 2 | 3 | 3 | 4 | 4
    shuffle(this.order); //Shuffles the players, so we don't know who's getting what.
    let nLiberals = Math.ceil((this.nPlaying + 1)/2);
    let nFascists = this.nPlaying - nLiberals - 1; 
    let PID;
    for(PID of this.order){
      console.log(`PID: ${PID}`);
      let player = this.players[PID];
      if(player.membership != -1){console.log("player already assigned role!"); continue;} 
      if(nLiberals > 0){
      this.liberals.push(PID);
      player.membership = 0;
      nLiberals--;
      }else if(nFascists > 0){
      this.fascists.push(player);
      player.membership = 1;
      nFascists--;
      }else{ //Last player in the list is hitler.
        if(this.hitler){console.log("ERROR! Hitler already defined");};
        player.membership = 2;
        this.hitler = player;
      }
    }
  }
  joinRoom(player){
    return;
    // if(player.membership == 1){
    //   this.io.to(player.SID).join('fascist');
    // } else if(player.membership == 0){
    //   this.io.to(player.SID).join('liberal')
    // } else if(player.membership == 2){
    //   if(this.nPlaying < 7){
    //     this.io.to(player.SID).join('fascist');
    //   } else{
    //     this.io.to(player.SID).join('liberal');
    //   }
    // }
  }
  reconnectPlayer(socket){
    let PID = this.lobby._sidpid[socket.id];
    console.log("RECONNECTING PLAYER!");
    this.activateGameSignals(socket);
    socket.emit('lobby game starting', {gameInfo: this.getLobbyGameInfo()});
    socket.emit(('reconnect game', this.getFullGameInfo(PID)))
  }
  getLobbyGameInfo(){
    return {
      isRunning: this.running,
      nRounds: this.rounds.length,
    }
  }
  getFullPlayerInfo(theirPID){
    //Constructs players.
    console.log("Full player info for " + theirPID);
    let player = this.players[theirPID];
    let getsMembershipInfo = 0;
    if(player){
      let getsMembershipInfo = this.gameStyle ? player.membership % 2 : player.membership;
    }
    let players = {}
    for(const PID of this.order){
      if(getsMembershipInfo || PID == theirPID ){
        players[PID] = (this.getFascistInfo(PID));
      }else{
        players[PID] = (this.getLiberalInfo(PID));
      }
    }
    return players
  }
  getFullGameInfo(PID){
    console.log(this.rounds);
    let arg = {
      players: this.getFullPlayerInfo(PID),
      order: this.order,
      rounds: this.rounds,
      isRunning: this.running,
    }
    return arg;
  }
  getLiberalInfo(PID){
    let player = this.players[PID];
    return { 
      username: player.username,
      PID: player.PID,
      membership: -1,
      alive: player.alive,
    }
  }
  getFascistInfo(PID){
    let info = this.getLiberalInfo(PID);
    info.membership = this.players[PID].membership;
    return info;
  }
  newRound(nextPresident = null){
    this.previousPresPID = this.presidentPID;
    this.previousChanPID = this.chancellorPID;
    if(nextPresident){ //If the next president has been pre-chosen,
      this.presidentPID = nextPresident;
    } else{
      this.presidentPID = this.order[this.currentPlayer];
      this.currentPlayer = (this.currentPlayer + 1) % this.nPlaying;
    }
    this.rounds.push([this.getStartingRoundEvent()]);
    this.sendNewRound();
    this.currentEvent="chancellor pick";
    this.buildEvent();
    this.sendLatestEvent();
  }
  getStartingRoundEvent(){
    return {
      name: "new round",
      details: {
        presidentPID: this.presidentPID,
        chancellorPID: this.chancellorPID,
        previousPresPID: this.previousPresPID,
        previousChanPID: this.previousChanPID,
        fasBoard: this.fasBoard,
        libBoard: this.libBoard,
        marker: this.marker,
        nInDiscard: this.policies.getAmountDiscarded(),
        nInDraw: this.policies.getAmountRemaining(),
        nVoted: 0,
        votes: {},
      }
    }
  }
  buildEvent(){
    let eventDetails = {};
    let eventSecret = {};
    switch(this.currentEvent){
      case "chancellor pick":
        break;// No extra data to be sent
      case "chancellor vote": 
        eventDetails = {
          chancellor: this.chancellorPID,
        }
        break;
      case "president discard":
        eventSecret = {
          PID: this.presidentPID,
          policies: this.policies.draw(3),
        }
        eventDetails = {
          nVoted: 0,
          votes: {},
          marker: this.marker,
          nInDiscard: this.policies.getAmountDiscarded(),
          nInDraw: this.policies.getAmountRemaining()
        }
        break;
      case "chancellor discard": 
        eventSecret = {
          PID: this.chancellorPID,
          policies: null, /*How where will these cards come from? */
        }
        eventDetails = {
          nInDiscard: this.policies.getAmountDiscarded(),
          nInDraw: this.policies.getAmountRemaining()
        }
      case "policy placed":
        eventDetails = {
          fasBoard: this.fasBoard,
          libBoard: this.libBoard,
        }
      case "president peek":
        eventSecret = {
          PID: this.presidentPID,
          policies: this.policies.view(3),
        }
        break; //No data changes!
      case "president pick":
        break; //Nothing changes!
      case "president kill":
        break;
    }
    let event = {
      name: this.currentEvent,
      details: eventDetails,
      secret: eventSecret
    }
    this.rounds[this.rounds.length - 1].push(event);
  }
  sendNewRound(){
    let round = this.rounds[this.rounds.length -1];
    this.io.emit("new round", {round: round});
  }
  sendLatestEvent(){
    let round = this.rounds[this.rounds.length - 1];
    let event = round[round.length - 1];
    this.io.emit("new event", {event: event});
  }
  activateGameSignals(socket){
    socket.on('get player info', (arg)=>{
      let PID = this.lobby._sidpid[socket.id];
      socket.emit('player info', {
        players: this.getFullPlayerInfo(PID),
        order: this.order,
      });
    })
    socket.on('chancellor picked', (arg)=>{
      //arg.PID
      //arg.pickedChancellor
      if(this.currentEvent != 'chancellor pick'){
        this.error("Event is not chancellor pick!");
        return;
      } else if(this.presidentPID != arg.PID){
        this.error("Non-president called 'chancellor picked!'");
        return;
      }
      this.chancellorPID = arg.pickedChancellor;
      this.currentEvent = 'chancellor vote';
      this.buildEvent();
      this.sendLatestEvent();
    })
    socket.on('cast vote', (arg)=>{
      //arg.PID and arg.vote.
      let PID = arg.PID;
      let player = this.players[PID];
      let round = this.rounds[this.rounds.length - 1];
      let event = round[round.length - 1];
      if(event.name != 'chancellor vote'){
        this.error('Vote cast at invalid time!');
      } else if(player.alive)
      player.vote = arg.vote;
      event.details.nVoted++;
      if(arg.vote){
        event.details.yesCount++;
      }
      socket.emit('vote recieved');
      if(event.details.nVoted >= this.nAlive){
        let yesRatio = event.details.yesCount/event.details.nVoted
        if(yesRatio <= .5){
          this.marker++;
          this.checkMarker();
        } else{
          if(this.chancellorPID == this.hitler.PID && this.fasBoard >= 3){
            this.endGame(1, 1);
          } else{
            this.currentEvent = "policy pick president"
            this.buildEvent();
            this.sendLatestEvent();
          }
        }
      }
    })
    socket.emit('player info', {
      players: this.getFullPlayerInfo(this.lobby._sidpid[socket.id]),
      order: this.order,
    })
  }
  placePolicy(value){
    //Places a policy. Returns 1 if somebody won.
    //Doesn't cause presidential policy events.
    if(value){
      this.fasBoard++;
      if(fasBoard == 6){
        this.endGame(1,0);
        return 1;
      }
    } else{
      this.libBoard++;
      if(this.libBoard == 6){
        this.endGame(0,0);
        return 1;
      }
    }
    return 0;
  }
  endGame(winner, reason){
    //winner: 0 = liberal, 1 = fascist.
    //Liberal reasons: 0 = cards, 1 = killed hitler.
    //Fascist reasons: 0 = cards, 1 = elected hitler.
    this.currentEvent = "end game"
    //Todo: implement the end of the game. should it be different than an event?
  }
  checkMarker(){
    if(this.marker >= 3){
      this.marker = 0;
      let drawnPolicy = this.policies.draw(1)[0];
      this.placePolicy(drawnPolicy);
      //TODO: broadcast some game event.

    }
  }
}

Player.prototype.membership = null;
Player.prototype.alive = null;
Player.prototype.vote = null;
Player.prototype.kill = function(){
  this.alive = false;
}

Player.prototype.getParty = function(){
  if(this.membership){
    return 1;
  } else{
    return 0;
  }
}

function shuffle(a){
  //For shuffling player order, roles, party Cards
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

module.exports = Hitler;

/* ***EVENT NAMES*** */
/* chancellor pick
   chancellor vote
   policy pick president (implies vote passed)
   policy pick chancellor
   enact policy
   president pick
   president kill
   president examine
   president peek

   next round(reason)
    -Occurs when:
      -vote doesn't pass
      -Liberal policy
      -Facist + no power
      -Veto occurs
   end game (reason)
    -Occurs when: 
      -hitler voted in, 
      -hitler is killed, 
      -enough policies are voted in.

*** Player Specific Events ***
  These are events where certain players get explicit information that other players do not.
  -When the event occurs they explicitly ask for the info.
    -president discard
    -chancellor discard
*/