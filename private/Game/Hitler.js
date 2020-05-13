var CardDeck = require('./CardDeck');
var {Lobbies, Lobby, Player} = require('../Lobby')
//Generally: 0 = Liberal, >0 = Fascist.
class Hitler{
  constructor(io, players, lobby){
    // this.lobby = lobby; //Remove this if possible.
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
    this.FasBoard = 0; //0-6
    this.LibBoard = 0; //0-6
    this.marker = 0; //0-3. If it turns to 3 it should be set to 0.
    this.nPlaying = 0;
    this.nAlive = 0;
    this.gameStyle = -1; // 0 is 5-6 players, 1 is 7-8, 2 is 9-10
    this.policies = null;
    this.rounds = [];
  }
  error(msg){
    console.log('Game Error! ' + msg);
  }
  init(){
    this.initPlayers();
    this.initPolicyCards();
    this.running = true;
    this.io.emit('game starting', {gameInfo: this.getLobbyGameInfo()});
    this.newRound();
  }
  initPlayers(){
    //Adds the alive and membership attributes to each player.
    let PID;
    for(PID in this.players){ 
      let player = this.players[PID];
      console.log(player);
      player.alive = true;
      player.membership = -1;
      this.nPlaying++; //reCalculate player count.
      this.nAlive++;
      //If 0, liberal. If 1, Fascist. If 2, Hitler. -1 is unassigned/spectating (?)
      this.order.push(PID);
      this.assignRoles();
    }
    shuffle(this.order); //Shuffle the order of players.
  }
  initPolicyCards(){
    let policyCards = [0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1]
    this.policies = new CardDeck(policyCards, true, true);
    this.policies.shuffleCards();
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
        if(this.nPlaying < 7){
          this.fascists.push(PID);
        } else{
          this.liberals.push(PID);
        }
      }
      this.joinRoom(player);
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
  reconnectPlayer(player){
    this.joinRoom(player);
  }
  getLobbyGameInfo(){
    return {
      isRunning: this.running,
      nRounds: this.rounds.length,
    }
  }
  getFullPlayerInfo(isFascist){
    //Constructs Player Info in the game order.
    let players = []
    let PID;
    for(PID of this.order){
      if(isFascist){
        players.append(this.players[PID].getFascistInfo());
      }else{
        players.append(this.players[PID].getLiberalInfo());
      }
    }
    return players
  }
  getFullGameInfo(isFascist){
    let arg = {
      isRunning: this.running,
      playersInOrder: this.getFullPlayerInfo(isFascist),
      rounds: this.rounds,
    }
    return arg;
  }
  newRound(nextPresident = null){
    this.io.emit('new round'); //I guess....
    this.rounds.push([]);
    this.previousPresPID = this.presidentPID;
    this.previousChanPID = this.chancellorPID;
    if(nextPresident){ //If the next president has been pre-chosen,
      this.presidentPID = nextPresident;
    } else{
      this.presidentPID = this.order[this.currentPlayer];
      this.currentPlayer = (this.currentPlayer + 1) % this.nPlaying;
    }
    this.currentEvent="chancellor pick";
    this.buildEvent();
    this.sendLatestEvent();
  }
  buildEvent(){
    let eventDetails = {};
    switch(this.currentEvent){
      case "chancellor picked": 
        break;
      case "chancellor vote":
        eventDetails.nVoted = 0;
        eventDetails.votes = {

        }
        break;
      }
    let eventInfo = {
      president: this.presidentPID,
      chancellor: this.chancellorPID,
      previousPres: this.previousPresPID,
      previousChan: this.previousChanPID,
      nInDiscard: this.policies.getAmountDiscarded(),
      nInDraw: this.policies.getAmountRemaining(),
    }
    let event = {
      name: this.currentEvent,
      info: eventInfo,
      details: eventDetails
    }
    this.rounds[this.rounds.length - 1].push(event);
  }
  sendLatestEvent(){
    let round = this.rounds[this.rounds.length - 1];
    let event = round[round.length - 1];
    this.io.emit(event.name, {event: event});
  }
  activateGameSignals(socket){
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
          if(this.chancellorPID == this.hitler.PID && this.FasBoard >= 3){
            this.endGame(1, 1);
          } else{
            this.currentEvent = "policy pick president"
            this.buildEvent();
            this.sendLatestEvent();
          }
        }
      }
    })
  }
  placePolicy(value){
    //Places a policy. Returns 1 if somebody won.
    //Doesn't cause presidential policy events.
    if(value){
      this.FasBoard++;
      if(FasBoard == 6){
        this.endGame(1,0);
        return 1;
      }
    } else{
      this.LibBoard++;
      if(this.LibBoard == 6){
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

Player.prototype.getLiberalInfo = function(){
  return { 
    username: this.username,
    PID: this.PID,
    membership: -1,
    alive: this.alive,
    vote: this.vote //If null, displays nothing.

  }
}

Player.prototype.getFascistInfo = function(){
  //adds membership information to the Liberal Info.
  let info = this.getLiberalInfo();
  info[membership] = this.membership;
  return info;
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