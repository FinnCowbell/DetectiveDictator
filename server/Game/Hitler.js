var CardDeck = require('./CardDeck');
var {Lobbies, Lobby, Player} = require('../Lobby')
//Generally: 0 = Liberal, >0 = Fascist.
class Hitler{
  constructor(io, players, lobby){
    this.lobby = lobby;
    this.running = false;
    this.io = io;
    this.players = players;
    this.memberships = {};
    this.order = []; //Order of players by PID.
    this.currentPlayer = 0; //Next President in order List.
    this.presidentPID = null; 
    this.chancellorPID = null;
    this.previousPresPID = null;
    this.previousChanPID = null;
    this.hitler = null;
    this.currentEvent = "pre game";
    this.fasBoard = 0; //0-6
    this.libBoard = 0; //0-6
    this.marker = 0; //0-3. If it turns to 3 it should be set to 0.
    this.nPlaying = 0;
    this.nAlive = 0;
    this.gameStyle = -1; // 0 is 5-6 players, 1 is 7-8, 2 is 9-10
    this.policies = new CardDeck([0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1], true, true);;
    this.rounds = [];
    this.votes = {};
    this.nVoted = 0;
    this.yesCount = 0;
  }
  error(msg){
    console.log('Game Error: ' + msg);
  }
  init(){
    this.initPlayers();
    this.policies.shuffleCards();
    this.initPlayerSignals();
    this.running = true;
    //Let the lobby know the game is starting. Send the game info to the lobby.
    this.io.emit('lobby update info', {lobbyInfo: this.lobby.getLobbyInfo()});
    this.newRound();
  }
  initPlayers(){
    //Sets the order of the players, Assigns their roles, Finalizes the player count.
    let PID;
    for(PID in this.players){ 
      let player = this.players[PID];
      player.alive = true;
      //If 0, liberal. If 1, Fascist. If 2, Hitler. -1 is unknown status and spectating. (?)
      player.membership = -1;
      this.nPlaying++; //reCalculate player count.
      this.nAlive++;
      this.order.push(PID);
    }
    this.assignRoles();
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
      let player = this.players[PID];
      if(player.membership != -1){console.log("player already assigned role!"); continue;} 
      if(nLiberals > 0){
        this.memberships[PID] = 0;
        player.membership = 0;
        nLiberals--;
      }else if(nFascists > 0){
        this.memberships[PID] = 1;
        player.membership = 1;
        nFascists--;
      }else{ //Last player in the list is hitler.
        this.memberships[PID] = 2;
        player.membership = 2;
        this.hitler = player;
      }
    }
  }
  initPlayerSignals(){
    //Activates game signals for all players.
    console.log("initializing signals for all players.."); 
    for(const PID of this.order){
      this.activateGameSignals(this.players[PID].socket);
    }
  }
  reconnectPlayer(socket){
    let theirPID = this.lobby._sidpid[socket.id];
    console.log(`Reconnecting player`);
    this.activateGameSignals(socket);
    socket.emit('reconnect game', this.getFullGameInfo(theirPID));
  }

  getLobbyGameInfo(){
    return {
      isRunning: this.running,
      nRounds: this.rounds.length,
    }
  }

  getFullGameInfo(PID){
    console.log(this.rounds);
    const arg = {
      order: this.order,
      rounds: this.rounds,
      isRunning: this.running,
    }
    //Get rid of secret and membership info that isn't theirs.
    //SecretInfo.PID is always the PID of the player who gets the info.
    // We don't want to make a copy of 
    // for(round of arg.rounds){
    //   for(event of round.events){
    //     if(event.details.secret.PID != PID){
    //       event.details.secret = {};
    //     }
    //   }
    //   if(this.knowsMemberships(PID)){
    //     round.memberships = this.memberships;
    //   } else{
    //     round.memberships = {};
    //     round.memberships[PID] =  this.membership[PID];
    //   }
    // }

    return arg;
  }

  getPlayerInfo(){
    //Constructs a players.
    //Memberships are stored separately and sent on a need-basis.
    let players = {}
    let player;
    for(const PID of this.order){
      player = this.players[PID]; 
      players[PID] = { 
        username: player.username,
        PID: player.PID,
        alive: player.alive,
      }
    }
    return players;
  }
  knowsMemberships(PID){
    let memberships = this.memberships;
    if(memberships[PID] == 1 || (memberships[PID] == 2 && this.gameStyle == 0)){
      return true;
    }
    return false;
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
    this.votes = {}
    this.nVoted = 0;
    this.yesCount = 0;

    this.buildNewRound();
    this.sendNewRound();
    this.currentEvent="chancellor pick";
    this.buildEvent();
    this.sendLatestEvent();
  }
  buildNewRound(){
    //Each round has its players s
    //When the round is sent to Fascists, membership information will be added.
    this.rounds.push({
      players: this.getPlayerInfo(),
      memberships: {},
      events: [{
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
          secret: {},
        },
      }]
    })
  }
  buildEvent(){
    let eventDetails = {};
    let eventSecret = {};
    switch(this.currentEvent){
      case "chancellor pick":
        break;// No extra data to be sent
      case "chancellor vote": 
        eventDetails = {
          chancellorPID: this.chancellorPID,
        }
        break;
      case "president discard":
        eventSecret = {
          PID: this.presidentPID,
          policies: this.policies.draw(3),
        }
        eventDetails = {
          nVoted: this.nVoted,
          votes: this.votes,
          marker: this.marker,
          nInDiscard: this.policies.getAmountDiscarded(),
          nInDraw: this.policies.getAmountRemaining(),
          secret: eventSecret,
        }
        break;
      case "chancellor discard": 
        let round = this.rounds[this.rounds.length - 1]
        let event = round.events[round.events.length - 1];
        let policies = event.details.secret.policies.slice();
        console.log("discarded index:" + event.details.secret.discardedIndex);
        policies.splice(event.details.secret.discardedIndex, 1);
        eventSecret = {
          PID: this.chancellorPID,
          policies: policies,
        }
        eventDetails = {
          nInDiscard: this.policies.getAmountDiscarded(),
          nInDraw: this.policies.getAmountRemaining(),
          secret: eventSecret,
        }
        break;
      case "policy placed":
        eventDetails = {
          fasBoard: this.fasBoard,
          libBoard: this.libBoard,
        }
        break;
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
    }
    this.rounds[this.rounds.length - 1].events.push(event);
  }
  sendNewRound(){
    //On New Rounds, some players get membership information.
    //Alternatively, players ONLY get thier membership information.
    let newRound = this.rounds[this.rounds.length -1];
    let player, membership, socket;
    for(const PID in this.players){
      player = this.players[PID];
      socket = player.socket;
      if(this.knowsMemberships(PID)){
        socket.emit("new round", {newRound: newRound, memberships: this.memberships})
      }else{
        membership = {}
        membership[PID] = this.memberships[PID];
        socket.emit("new round", {newRound: newRound, memberships: membership})
      }
    }
  }

  sendLatestEvent(){
    let events = this.rounds[this.rounds.length - 1].events;
    let event = events[events.length - 1];
    let player, socket;
    let secret = event.details.secret;
    if(secret){
      console.log("Sending With Secret!");
      console.log(secret);
      socket = this.players[secret.PID].socket;
      socket.emit("new event", {event: event})
      event.details.secret = {};
      for(const PID in this.players){
        if(PID == secret.PID){continue;}
        socket = this.players[PID].socket;
        socket.emit("new event", {event: event});
      }
      event.details.secret = secret;
    } else{
      this.io.emit("new event", {event: event});
    }
  }

  activateGameSignals(socket){
    //Activates game signals for a socket.
    //If this is a  reconnect, it's assumed that this socket is linked to a player.
    let theirPID = this.lobby._sidpid[socket.id];
    socket.on('chancellor picked', (arg)=>{
      if(this.currentEvent != 'chancellor pick'){
        this.error("Event is not chancellor pick!");
        return;
      } else if(this.presidentPID != theirPID){
        this.error("Non-president called 'chancellor picked!'");
        return;
      }
      this.chancellorPID = arg.pickedChancellor;
      console.log(`Chancellor PID Picked: ${this.chancellorPID}`);
      this.currentEvent = 'chancellor vote';
      this.buildEvent();
      this.sendLatestEvent();
    })
    socket.on('cast vote', (arg)=>{
      //arg.vote
      let player = this.players[theirPID];
      let round = this.rounds[this.rounds.length - 1];
      let event = round.events[round.events.length - 1];
      if(event.name != 'chancellor vote'){
        this.error('Vote cast at invalid time!');
        return;
      } else if(!player.alive){
        this.error('Dead men tell no tales!');
        return;
      } if(this.votes[theirPID] == 0 || this.votes[theirPID] == 1){
        this.error('Vote already exists!');
        return;
      }
      this.votes[theirPID] = arg.vote;
      this.nVoted++;
      if(arg.vote == true){
        this.yesCount++;
      }
      // console.log("Vote Cast!");
      // console.log("nAlive: " + this.nAlive);
      // console.log("nVoted: " + this.nVoted);
      // socket.emit('vote recieved');
      if(this.nVoted >= this.nAlive){
        console.log("Vote Complete!!");
        let yesRatio = this.yesCount / this.nVoted;
        console.log("YesRatio: " + yesRatio);
        if(yesRatio <= .5){
          this.marker++;
          this.checkMarker();
          this.presidentPID = null;
          this.chancellorPID = null;
          this.newRound();
        } else{
          if((this.chancellorPID == (this.hitler && this.hitler.PID)) && this.fasBoard >= 3){
            this.endGame(1, 1);
          } else{
            this.marker = 0;
            this.currentEvent = "president discard"
            this.buildEvent();
            this.sendLatestEvent();
          }
        }
      }
    })
    socket.on('president discarding', (arg)=>{
      let player = this.players[theirPID];
      let round = this.rounds[this.rounds.length - 1];
      let event = round.events[round.events.length - 1];
      if(this.presidentPID != theirPID){
        this.error("Non-president trying to discard");
        return;
      } else if(event.name != 'president discard'){
        this.error("president discarding during invalid event!");
        return;
      }
      let policyIndex = arg.policyIndex;
      this.policies.discard(event.details.secret.policies[policyIndex]);
      event.details.secret.discardedIndex = policyIndex;
      this.currentEvent = "chancellor discard";
      this.buildEvent();
      this.sendLatestEvent();
    })
    socket.on('chancellor discarding', (arg)=>{
      let player = this.players[theirPID];
      let round = this.rounds[this.rounds.length - 1];
      let event = round.events[round.events.length - 1];
      if(this.chancellorPID != theirPID){
        this.error("Non-chancellor trying to discard");
        return;
      } else if(event.name != 'chancellor discard'){
        this.error("chancellor discarding during invalid event!");
        return;
      }
      let policyIndex = arg.policyIndex;
      this.policies.discard(event.details.secret.policies[policyIndex]);
      event.details.secret.discardedIndex = policyIndex;
      let placedPolicy = event.details.secret.policies.slice().splice(policyIndex,1)[0];
      this.enactPolicy(placedPolicy);
    })
  }
  enactPolicy(value){
    let endedGame = this.placePolicy(value);
    if(!endedGame){
      if(value){
        this.checkAction();
      }
      else{
        this.newRound();
      }
    }
  }
  placePolicy(value){
    //Places a policy. Returns 1 if somebody won.
    //Doesn't cause presidential policy events.
    if(value){
      this.fasBoard++;
      if(this.fasBoard == 6){
        this.endGame(1,0);
        return 1;
      }
    } else{
      this.libBoard++;
      if(this.libBoard == 5){
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
   president discard (implies vote passed)
   chancellor discard
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