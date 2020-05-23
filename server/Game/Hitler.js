var CardDeck = require('./CardDeck');
var {Lobbies, Lobby, Player} = require('../Lobby')
//Generally: 0 = Liberal, >0 = Fascist.

class Hitler{
  constructor(io, devMode, players, lobby){
    this.lobby = lobby;
    this.running = false;
    this.io = io;
    this.isDevMode = devMode;
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
    //Used for voting
    this.votes = {};
    this.nVoted = 0;
    this.yesCount = 0;
    //Should only be used during executive actions.
    this.investigatee = null;
    this.victim = null;
    /*Wait time between events in milliseconds.
    Occurs to separate actions such as placing cards and the following round or president action.
    As secret hitler is a somewhat slower-paced game, my goal with this is to try to get players 
    to slow down and think between events.*/
    this.WAIT_TIME = 3000; 
  }
  error(msg){
    this.lobby.error(msg);
  }
  log(msg){
    this.lobby.log(msg);
  }
  init(){
    //Let the lobby know the game is starting. Send the game info to the lobby.
    this.newGame();
    this.lobby.emitUpdateLobby();
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
    } else if(this.nPlaying == 7 ||  this.nPlaying == 8){
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
      if(player.membership != -1){this.error("player already assigned role!"); continue;} 
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
    for(const PID of this.order){
      this.activateGameSignals(this.players[PID].socket);
    }
  }

  reconnectPlayer(socket){
    let theirPID = this.lobby._sidpid[socket.id];
    this.activateGameSignals(socket);
    socket.emit('full game info', this.getFullGameInfo(theirPID));
  }

  getLobbyGameInfo(){
    return {
      isRunning: this.running,
      nRounds: this.rounds.length,
    }
  }

  getFullGameInfo(PID){
    //Runs at the beginning of a game and on reconnect.
    //Gives player order, membership info, and all previous rounds with that player's secrets.
    //Players are stored within rounds.
    const arg = {
      order: this.order,
      gameStyle: this.gameStyle,
      memberships: {},
      isRunning: this.running,
      rounds: [],
    }
    //Give each player their correct memberships.
    if(this.knowsMemberships(PID)){
      arg.memberships = this.memberships;
    } else{
      arg.memberships[PID] = this.memberships[PID];
    }

    let clonedRounds = JSON.parse(JSON.stringify(this.rounds));
    //Rebuild all rounds.
    let round, event;
    for(let roundNumber in clonedRounds){
      round = clonedRounds[roundNumber]
      
      for(let eventNumber in round.events){
        event = round.events[eventNumber];
        if(PID != (event.details.secret && event.details.secret.PID)){
          event.details.secret = {}; 
        }
      }
    }
    arg.rounds = clonedRounds;
    return arg;
  }

  getPlayerInfo(){
    //Constructs player info for all players.
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

  newGame(){
    //Reset all "state" variables.
    this.rounds = [];
    this.order = []; //Order of players by PID.
    this.currentPlayer = 0; //Next President in order List.
    this.presidentPID = null; 
    this.chancellorPID = null;
    this.previousPresPID = null;
    this.previousChanPID = null;
    this.hitler = null;
    this.currentEvent = "pre game";
    this.fasBoard = 0;
    this.libBoard = 0;
    this.marker = 0;
    this.nPlaying = 0;
    this.nAlive = 0;
    this.initPlayers();
    this.policies.shuffleCards();
    this.initPlayerSignals();
    this.running = true;
    //
    this.buildNewRound();
    this.currentEvent="chancellor pick";
    this.buildEvent();
    this.sendFullGameInfo();
  }
  sendFullGameInfo(){
    let PID;
    for(PID of Object.keys(this.players)){
      let socket = this.players[PID].socket;
      if(socket){//In case player is disconnected for any reason.
        socket.emit('full game info', this.getFullGameInfo(PID));
      }
    }
  }
  newRound(nextPresident = null){
    this.buildNewRound(nextPresident);
    let newRound = this.rounds[this.rounds.length -1];
    this.io.emit("new round", {newRound: newRound});
    this.currentEvent="chancellor pick";
    this.buildEvent();
    this.sendLatestEvent();
  }
  buildNewRound(nextPresident = null){
    //Each round has player info stored with it.
    //Players don't change very much (Except on round-ending events).
    if(!this.isDevMode){
      this.previousPresPID = this.presidentPID;
      this.previousChanPID = this.chancellorPID;  
    }
    this.presidentPID = null;
    this.chancellorPID = null;
    if(nextPresident){ //If the next president has been pre-chosen,
      this.presidentPID = nextPresident;
    } else{
      let PID, player;
      for(let i = 0; i < this.nPlaying; i++){
        PID = this.order[this.currentPlayer];
        player = this.players[PID];
        if(player.alive == true){
          break;
        }
        this.currentPlayer = (this.currentPlayer + 1) % this.nPlaying;
      }
      this.presidentPID = this.order[this.currentPlayer];
      this.currentPlayer = (this.currentPlayer + 1) % this.nPlaying;
    }
    this.votes = {}
    this.nVoted = 0;
    this.yesCount = 0;

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
          nVoted: this.nVoted,
          votes: this.votes,
          secret: {},
        },
      }]
    })
  }
  buildEvent(secret){
    let eventDetails = {};
    let eventSecret = secret || {};
    switch(this.currentEvent){
      case "chancellor pick":
        break;// No extra data to be sent
      case "chancellor vote": 
        eventDetails = {
          chancellorPID: this.chancellorPID,
        }
        break;
      case "chancellor not voted":
        eventDetails = {
          votes: this.votes,
          marker: this.marker,
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
      case "liberal policy placed":
        eventDetails = {
          nInDiscard: this.policies.getAmountDiscarded(),
          libBoard: this.libBoard,
        }
        break;
      case "fascist policy placed":
        eventDetails = {
          nInDiscard: this.policies.getAmountDiscarded(),
          fasBoard: this.fasBoard,
        }
        break;
        case "president peek":
          eventSecret = {
            PID: this.presidentPID,
            policies: this.policies.view(3),
          }
          eventDetails = {
            nInDraw: this.policies.getAmountRemaining(),
            nInDiscard: this.policies.getAmountDiscarded(),
            secret: eventSecret
        }
        break;
      case "president investigate":
        break; //No data changes!
      case "president investigated":
        eventSecret = {
          PID: this.presidentPID,
          membership: this.memberships[this.investigatee],
        };
        eventDetails = {
          investigatee: this.investigatee,
          secret: eventSecret,
        }
        /*Reset investigatee directly after this.
          I know it effectively becomes an argument I can pass, but I hope to 
          restructure argument passing at some point in the near future.
        */
        this.investigatee = null;
        break;
      case "president pick":
        break; //Nothing changes!
      case "president kill":
        break;
      case "player killed":
        eventDetails = {
          victim: this.victim,
        }
        this.victim = null;
        this.nAlive--;
        break;
      default:
        break;
    }
    let event = {
      name: this.currentEvent,
      details: eventDetails,
    }
    this.rounds[this.rounds.length - 1].events.push(event);
  }

  sendLatestEvent(){
    let events = this.rounds[this.rounds.length - 1].events;
    let event = events[events.length - 1];
    let player, socket;
    let secret = event.details.secret;
    if(secret){
      socket = this.players[secret.PID].socket;
      if(socket){
        socket.emit("new event", {event: event})
      }
      event.details.secret = {};
      for(const PID in this.players){
        if(PID == secret.PID){continue;}
        socket = this.players[PID].socket;
        if(socket){
          socket.emit("new event", {event: event})
        }
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
      socket.emit('confirm vote', null);
      this.io.emit('new ui event',{
        name: 'player voted',
        PID: theirPID,
      });
      if(this.nVoted >= this.nAlive){
        let yesRatio = this.yesCount / this.nVoted;
        if(yesRatio <= .5){
          this.marker++;
          this.presidentPID = null;
          this.chancellorPID = null;
          this.currentEvent = "chancellor not voted";
          this.buildEvent();
          this.sendLatestEvent();
          setTimeout(
            ()=>{
              if(this.checkMarker()){
                return;
              }else{
                this.newRound()
              }},
            this.WAIT_TIME
          );
        } else{
          if((this.chancellorPID == (this.hitler && this.hitler.PID)) && this.fasBoard >= 3){
            return this.endGame(1, 1);
          } else{
            this.marker = 0;
            this.currentEvent = "president discard"
            this.buildEvent();
            this.sendLatestEvent();
            return;
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
      //arg.policyIndex.
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
      let placedPolicy = event.details.secret.policies.slice();
      placedPolicy.splice(policyIndex, 1)[0];
      this.log('policyIndex: '+ policyIndex);
      this.log('placedPolicy: ' + placedPolicy);
      this.enactPolicy(placedPolicy);
    })
    socket.on('president done', ()=>{
      if(this.currentEvent != "president peek" && this.currentEvent != "president investigated"){
        this.error("Event isn't valid!");
      } else if (this.presidentPID != theirPID){
        this.error("Non-president sent 'done'");
      } else{
        this.newRound();
      }
    })
    socket.on('president picked', (arg)=>{
      if(this.currentEvent != "president pick" || this.presidentPID != theirPID){
        this.error("Cannot pick president!")
      } else{
        this.newRound(arg.pickedPresident)
      }
    })
    socket.on('president investigate request', (arg)=>{
      if(this.currentEvent != "president investigate"){
        this.error("Event isn't Investigate!");
      } else if (this.presidentPID != theirPID){
        this.error("Non-president sent 'investigate request'");
      }
      this.investigatee = arg.investigatee;
      this.currentEvent = 'president investigated'
      this.buildEvent();
      this.sendLatestEvent();
    })
    socket.on('president kill request', (arg)=>{
      if(this.currentEvent != "president kill"){
        this.error("Event isn't Kill!");
      } else if (this.presidentPID != theirPID){
        this.error("Non-president sent 'kill request'");
      }
      this.victim = arg.victim;
      this.players[arg.victim].alive = false;
      this.currentEvent = 'player killed'
      this.buildEvent();
      this.sendLatestEvent();
      setTimeout(()=>{
        this.newRound();
      }, this.WAIT_TIME);
    });
    socket.on('move bullet', (arg)=>{
      if(this.currentEvent == "president kill"){
        arg.name = 'move bullet'
        socket.broadcast.emit('new ui event', (arg));
      }
    })
  }
  enactPolicy(value){
    //enacting a policy checks for executive actions. Placing a policy does not.
    let endedGame = this.placePolicy(value);
    if(!endedGame){
      //Wait WAIT_TIME mS before continuing the game.
      setTimeout(()=>{
        if(value == 1){
          this.evalExecutiveAction();
        }
        else{
          this.newRound();
        }
      },this.WAIT_TIME)
    }
  }
  evalExecutiveAction(){
    if(this.gameStyle == 0){ //5-6 players
        switch(this.fasBoard){
          // case 1:
          //   this.currentEvent = "president kill";
          //   break;
          case 3:
            this.currentEvent = "president peek";
            break;
          case 4:
            this.currentEvent = "president kill";
            break;
          case 5:
            this.currentEvent = "president kill";
            break;
          default:
            this.newRound();
            return;
            break;
        }
        this.buildEvent();
        this.sendLatestEvent();
    } else if(this.gameStyle == 1){ //7-8 players
      switch(this.fasBoard){
        case 2:
          this.currentEvent = "president investigate"
          break;
        case 3:
          this.currentEvent = "president pick";
          break;
        case 4:
          this.currentEvent = "president kill";
          break;
        case 5:
          this.currentEvent = "president kill";
          break;
        default:
          this.newRound();
          return;
          break;
      }
    } else if(this.gameStyle == 2){ // 9-10 players
      switch(this.fasBoard){
        case 1:
          this.currentEvent = "president investigate";
          break;
        case 2:
          this.currentEvent = "president investigate";
          break;
        case 3:
          this.currentEvent = "president pick";
          break;
        case 4:
          this.currentEvent = "president kill";
          break;
        case 5:
          this.currentEvent = "president kill";
          break;
        default:
          this.newRound();
          return;
          break;
      }
    } else{
      this.error("Gamestyle incorrectly set!");
      return;
    }
    this.buildEvent();
    this.sendLatestEvent();
  }
  placePolicy(value){
    //Places a policy, and sends the placed policy event. Returns 1 if somebody won.
    //Doesn't cause presidential policy events.
    if(value == 1){
      this.fasBoard++;
      if(this.fasBoard == 6){
        this.endGame(1,0);
        return 1;
      }
    } else if(value == 0){
      this.libBoard++;
      if(this.libBoard == 5){
        this.endGame(0,0);
        return 1;
      }
    } else{
      this.error(`Policy was ${value}, not 1 or 0!`);
      return -1;
    }
    if(value == 1){
      this.currentEvent = 'fascist policy placed';
    } else{
      this.currentEvent = 'liberal policy placed'; 
    }
    this.buildEvent();
    this.sendLatestEvent();
    return 0;
  }
  // checkExecutiveAction(){
  //   return;
  // }
  endGame(winner, reason){
    //winner: 0 = liberal, 1 = fascist.
    //Liberal reasons: 0 = cards, 1 = killed hitler.
    //Fascist reasons: 0 = cards, 1 = elected hitler.
    let endGame = [["liberal win cards", "liberal win hitler"],["fascist win cards","fascist win hitler"]]
    this.rounds.push({
      players: this.getPlayerInfo(),
      memberships: this.memberships,
      events: [{
        name: 'end game',
        details: {
          reason: endGame[winner][reason],
          presidentPID: this.presidentPID,
          chancellorPID: this.chancellorPID,
          previousPresPID: this.previousPresPID,
          previousChanPID: this.previousChanPID,
          fasBoard: this.fasBoard,
          libBoard: this.libBoard,
          marker: this.marker,
          nInDiscard: this.policies.getAmountDiscarded(),
          nInDraw: this.policies.getAmountRemaining(),
          nVoted: this.nVoted,
          votes: this.votes,
          secret: {},
        },
      }]
    })
    let newRound = this.rounds[this.rounds.length -1];
    this.io.emit("end game", {endState: newRound});

  }
  checkMarker(){
    if(this.marker == 3){
      this.marker = 0;
      let drawnPolicy = this.policies.draw(1)[0];
      this.placePolicy(drawnPolicy);
      setTimeout(()=>this.newRound(),this.WAIT_TIME);
      return 1;
    }
    return 0;
  }
}

Player.prototype.membership = null;
Player.prototype.alive = null;
Player.prototype.vote = null;

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