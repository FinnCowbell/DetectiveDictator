var CardDeck = require('./CardDeck');
//Generally: 0 = Liberal, >0 = Fascist.

class Hitler{
  constructor(io, devMode, players, lobby){
    this.lobby = lobby;
    this.running = false;
    this.io = io;
    this.isDevMode = devMode;
    this.players = players;
    this.memberships = {};
    this.currentEvent = "pre game";
    this.order = []; //Order of players by PID.
    this.currentPlayer = 0; //Next President in order List.
    this.presidentPID = null; 
    this.chancellorPID = null;
    this.previousPresPID = null;
    this.previousChanPID = null;
    this.hitler = null;
    this.fasBoard = 0; //0-6
    this.libBoard = 0; //0-6
    this.marker = 0; //0-3. If it turns to 3 it should be set to 0.
    this.nPlaying = 0;
    this.nAlive = 0;
    this.gameStyle = -1; // 0 is 5-6 players, 1 is 7-8, 2 is 9-10
    this.policies = new CardDeck([0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1], true, true);;
    this.rounds = [];
    this.remainingPolicy = null;
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
      //If 0, liberal. If 1, Fascist. If 2, Hitler. -1 is spectating.
      if(player.membership != -1){//Do not include spectators
        player.membership = null;
      }
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
      if(player.membership !== null){
        this.error("player already assigned role!"); continue;
      }
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
  
  initSpectator(socket){
    //No incoming game signals from spectators.
    let theirPID = this.lobby._sidpid[socket.id];
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
  newRound(nextPresident = null, playersWereElected = true){
    this.buildNewRound(nextPresident, playersWereElected);
    let newRound = this.rounds[this.rounds.length -1];
    this.io.emit("new round", {newRound: newRound});
    this.currentEvent="chancellor pick";
    this.buildEvent();
    this.sendLatestEvent();
  }
  buildNewRound(nextPresident = null, playersWereElected = true){
    //Each round has player info stored with it.
    //Players don't change very much (Except on round-ending events).
    if(this.isDevMode){
      playersWereElected = false;
    }

    if(playersWereElected){
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
    let round, event;
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
        round = this.rounds[this.rounds.length - 1]
        event = round.events[round.events.length - 1];
        let policies = event.details.secret.policies.slice();
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
      case "veto requested": 
        round = this.rounds[this.rounds.length - 1];
        event = round.events[round.events.length - 1];
        eventDetails = {
          nInDiscard: this.policies.getAmountDiscarded(),
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
          membership: this.memberships[this.investigatee] > 0 ? 1 : 0,
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
    event = {
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
        return this.error("Event is not chancellor pick!");
      } else if(this.presidentPID != theirPID){
        return this.error("Non-president called 'chancellor picked!'");
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
        return this.error('Vote cast at invalid time!');
      } else if(!player.alive){
        return this.error('Dead men tell no tales!');
      } if(this.votes[theirPID] == 0 || this.votes[theirPID] == 1){
        return this.error('Vote already exists!');
      }

      this.votes[theirPID] = arg.vote;
      this.nVoted++;
      if(arg.vote == true){
        this.yesCount++;
      }
      //For now, repack the argument and send the UI event.
      let uiEventArg = {
        name: 'player voted',
        PID: theirPID,
      }
      this.sendUIEvent(uiEventArg, theirPID, socket);
      //Send just to the player. We can skip error checking as we know all values exist.
      socket.emit('ui event', uiEventArg);
      if(this.nVoted >= this.nAlive){
        let yesRatio = this.yesCount / this.nVoted;
        if(yesRatio <= .5){
          //Marker is moved immediately, so it moves ASAP on the player's side.
          this.marker++;
          this.presidentPID = null;
          this.chancellorPID = null;
          this.currentEvent = "chancellor not voted";
          this.buildEvent();
          this.sendLatestEvent();
          setTimeout(()=>this.checkMarker(), this.WAIT_TIME);
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
      let round = this.rounds[this.rounds.length - 1];
      let event = round.events[round.events.length - 1];
      if(this.presidentPID != theirPID){
        return this.error("Non-president trying to discard");
      } else if(event.name != 'president discard'){
        return this.error("president discarding during invalid event!");
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
      let round = this.rounds[this.rounds.length - 1];
      let event = round.events[round.events.length - 1];
      if(this.chancellorPID != theirPID){
        return this.error("Non-chancellor trying to discard");
      } else if(event.name != 'chancellor discard'){
        return this.error("chancellor discarding during invalid event!");
      }
      let policyIndex = arg.policyIndex;
      this.policies.discard(event.details.secret.policies[policyIndex]);
      event.details.secret.discardedIndex = policyIndex;
      let placedPolicy = event.details.secret.policies.slice();
      placedPolicy.splice(policyIndex, 1);
      this.enactPolicy(placedPolicy);
    })
    socket.on('president done', ()=>{
      if(this.currentEvent != "president peek" && this.currentEvent != "president investigated"){
        return this.error("Event isn't valid!");
      } else if (this.presidentPID != theirPID){
        return this.error("Non-president sent 'done'");
      } else{
        this.newRound();
      }
    })
    socket.on('president picked', (arg)=>{
      if(this.currentEvent != "president pick" || this.presidentPID != theirPID){
        return this.error("Cannot pick president!")
      } else{
        this.newRound(arg.pickedPresident, true);
      }
    })
    socket.on('president investigate request', (arg)=>{
      if(this.currentEvent != "president investigate"){
        return this.error("Event isn't Investigate!");
      } else if (this.presidentPID != theirPID){
        return this.error("Non-president sent 'investigate request'");
      }
      this.investigatee = arg.investigatee;
      this.currentEvent = 'president investigated'
      this.buildEvent();
      this.sendLatestEvent();
    })
    socket.on('president kill request', (arg)=>{
      if(this.currentEvent != "president kill"){
        return this.error("Event isn't Kill!");
      } else if (this.presidentPID != theirPID){
        return this.error("Non-president sent 'kill request'");
      }
      this.victim = arg.victim;
      this.players[arg.victim].alive = false;
      if(this.victim == this.hitler.PID){
        return this.endGame(0,1);
      }
      this.currentEvent = 'player killed'
      this.buildEvent();
      this.sendLatestEvent();
      setTimeout(()=>{
        this.newRound();
      }, this.WAIT_TIME);
    });
    socket.on('veto request', (arg)=>{
      let round = this.rounds[this.rounds.length - 1];
      let event = round.events[round.events.length - 1];
      if(this.currentEvent != "chancellor discard" || this.chancellorPID != theirPID || this.fasBoard != 5){
        return this.error("This player cannot veto now!")
      }
      let policyIndex = arg.policyIndex;
      this.policies.discard(event.details.secret.policies[policyIndex]);
      let policies = event.details.secret.policies.slice()
      policies.splice(policyIndex,1);
      this.remainingPolicy = policies[0];
      this.currentEvent = 'veto requested'
      this.buildEvent();
      this.sendLatestEvent();
    })
    socket.on('confirm veto request', (arg)=>{
      if(this.currentEvent != "veto requested" || this.presidentPID != theirPID || this.fasBoard != 5){
        return this.error("This player cannot confirm veto now!")
      }
      let remainingPolicy = this.remainingPolicy;
      if(arg.isJa){
        this.currentEvent = 'veto accepted';
        this.policies.discard(remainingPolicy);
        setTimeout(()=>{
          this.newRound()
        }, this.WAIT_TIME)
      } else{
        this.currentEvent = 'veto denied'
        setTimeout(()=>{
          this.enactPolicy(remainingPolicy);
        }, this.WAIT_TIME);
      }
      this.remainingPolicy = null;
      this.buildEvent();
      this.sendLatestEvent();
    });
    socket.on('send ui info', (arg)=>this.sendUIEvent(arg, theirPID, socket));
  }
  
  sendUIEvent(arg, theirPID, socket){
    //Required UI arguments for each UI event.
    //If an event is missing any of their arguments, then shoot an error.
    const uiArgs = {
      'select player': ['PID'],
      'player voted': ['PID'],
    }
    const uiReqs = {
      'select player': this.presidentPID == theirPID,
      'player voted': true, //Only called when allowed.
    }
    if(!arg || !arg.name){
      return this.error('arg or arg name is undefined.')
    }
    let requiredArgs = uiArgs[arg.name];
    let givenArgs = new Set(Object.keys(arg));
    let canSendEvent = uiReqs[arg.name];
    for(let arg of requiredArgs){
      if(!givenArgs.has(arg)){
        return this.error(`Missing arg in ui info: ${arg}`);
      }
    }
    if(!canSendEvent){
      return this.error('Ui info requirements not met!');
    }
    socket.broadcast.emit('ui event', (arg));
  }

  enactPolicy(value){
    //enacting a policy checks for executive actions. Placing a policy does not.
    let endedGame = this.placePolicy(value);
    if(!endedGame){
      //Wait WAIT_TIME before continuing the game.
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
          case 3:
            this.currentEvent = "president peek"; break;
          case 4:
            this.currentEvent = "president kill"; break;
          case 5:
            this.currentEvent = "president kill"; break;
          default:
            this.newRound();
            return;
        }
        this.buildEvent();
        this.sendLatestEvent();
    } else if(this.gameStyle == 1){ //7-8 players
      switch(this.fasBoard){
        case 2:
          this.currentEvent = "president investigate"; break;
        case 3:
          this.currentEvent = "president pick"; break;
        case 4:
          this.currentEvent = "president kill"; break;
        case 5:
          this.currentEvent = "president kill"; break;
        default:
          this.newRound();
          return;
      }
    } else if(this.gameStyle == 2){ // 9-10 players
      switch(this.fasBoard){
        case 1:
          this.currentEvent = "president investigate"; break;
        case 2:
          this.currentEvent = "president investigate"; break;
        case 3:
          this.currentEvent = "president pick"; break;
        case 4:
          this.currentEvent = "president kill"; break;
        case 5:
          this.currentEvent = "president kill"; break;
        default:
          this.newRound();
          return;
      }
    } else{
      return this.error("Gamestyle incorrectly set!");
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
      return this.error(`Policy was ${value}, not 1 or 0!`);
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
  endGame(winner, reason){
    //winner: 0 = liberal, 1 = fascist.
    //Reasons: 0 = cards, 1 = killed/elected hitler.
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
    let delay = 0;
    if(this.marker == 3){
      this.marker = 0;
      let drawnPolicy = this.policies.draw(1)[0];
      this.placePolicy(drawnPolicy);
      delay = this.WAIT_TIME;
    }
    setTimeout(()=>this.newRound(false, false), delay);
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
   enactPolicy() and placePolicy()
    -liberal policy placed
    -fascist policy placed

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
*/