var CardDeck = require("./CardDeck");
var GameModule = require("./GameModule");
//Generally: 0 = Liberal, >0 = Fascist.

class Hitler extends GameModule {
  constructor(lobby) {
    super(lobby);
    this.MIN_PLAYERS = 4;
    this.MAX_PLAYERS = 10;
    this.gameStatus = "pregame"
    this.gameInfo = {
      order: [], //Order of players by PID.
      style: -1, // 0 is 5-6 players, 1 is 7-8, 2 is 9-10,
    };
    this.rounds = [];
    this.currentEvent = "pre game";
    this.presidentIndex = -1; //Next President in order List.
    this.presidentPID = null;
    this.chancellorPID = null;
    this.previousPresPID = null;
    this.previousChanPID = null;
    this.fasBoard = 0; //0-6
    this.libBoard = 0; //0-6
    this.marker = 0; //0-3. If it turns to 3 it should be set to 0.
    this.nAlive = 0;
    this.policies = new CardDeck(
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      true,
      true
    );
    this.remainingPolicy = null;
    //Used for voting
    this.votes = {};
    this.nVoted = 0;
    this.yesCount = 0;

    //Should only be used during executive actions.
    this.investigatedName = null;
    this.victim = null;

    /*Wait time between events in milliseconds.
    Occurs to separate actions such as placing cards and the following round or president action.
    As secret hitler is a somewhat slower-paced game, my goal with this is to try to get players 
    to process events as they occur, and encourage more natural game-flow.*/
    this.WAIT_TIME = 3000;
    if (lobby.devMode) {
      this.WAIT_TIME = 500;
    }
  }

  init() {
    //Let the lobby know the game is starting. Send the game info to the lobby.
    this.newGame();
    this.lobby.emitUpdateLobby();
  }

  prototypeModuleInfo(Player) {
    Player.prototype.info = function () {
      return { ...this, socket: undefined };
    };
    Player.prototype.liberalInfo = function () {
      return { ...this.info(), membership: null, hand: {} };
    };
    Player.prototype.fascistInfo = function () {
      return { ...this.info(), hand: {} };
    };
  }

  connectNewPlayer(player) {
    player.membership = null;
    player.alive = true;
    player.hand = {
      vote: null,
      policies: null,
      investigatedMembership: null,
    };
  }

  reconnectPlayer(player) {
    this.activateGameSignals(player);
    player.socket.emit("full game info", this.getRoundInfo(player.PID));
  }

  connectSpectator(spectator) {
    // Omnipotent = all knowing.
    spectator.omnipotent = false;
    //No incoming game signals from spectators.
    if(this.gameStatus != "ingame"){
      spectator.omnipotent = true;
    }
    if (this.gameStatus != "pregame") {
      spectator.socket.emit("full game info", this.getRoundInfo(spectator.PID));
    }
  }

  initPlayers() {
    //Sets the order of the players, Assigns their roles, Finalizes the player count.
    //Order is a list of non-spectating PIDs.
    this.gameInfo.order = Object.values(this.players)
      .filter((p) => !p.isSpectating)
      .map((player) => player.PID);
    this.assignRoles();
    shuffle(this.gameInfo.order); //Shuffle the order of players.
    this.nAlive = this.gameInfo.order.length;
    this.gameInfo.style = this.nAlive <= 6 ? 0 : this.nAlive <= 8 ? 1 : 2;
  }

  assignRoles() {
    // PLAYERS | 5 | 6 | 7 | 8 | 9 | 10
    // LIBERALS| 3 | 4 | 4 | 5 | 5 | 6
    // FASCISTS| 2 | 2 | 3 | 3 | 4 | 4
    //Liberal: 0 Fascist: 1 Hitler: 2
    let nPlaying = this.gameInfo.order.length;
    let nLiberals = Math.ceil((nPlaying + 1) / 2);

    shuffle(this.gameInfo.order); //Shuffles the players, so we don't know who's getting what.
    this.gameInfo.order.forEach((PID, index) => {
      let membership, player;
      player = this.players[PID];
      if (player.membership !== null) {
        //Still assign membership.
        this.error("player already assigned role!");
        membership = player.membership;
      } else {
        membership = index == 0 ? 2 : index <= nLiberals ? 0 : 1;
      }
      player.membership = membership;
    });
  }

  initPlayerSignals() {
    //Activates game signals for all players.
    this.gameInfo.order.forEach((PID) =>
      this.activateGameSignals(this.players[PID])
    );
  }

  getRoundInfo(PID) {
    //Runs at the beginning of a game and on reconnect.
    //Players are stored within rounds.
    return {
      round: { ...this.latestRound(), players: this.getPlayerInfo(PID) },
    };
  }

  getPlayerInfo(playersPID = null) {
    //Constructs player info for all players.
    //If it's for a specific player, gives the correct info.
    let players = {};
    if (playersPID === null) {
      //If no player is specified, give all the info for every player.
      this.gameInfo.order.forEach((PID) => {
        let p = this.players[PID];
        players[PID] = p.getInfo();
      });
    } else {
      this.gameInfo.order.forEach((PID) => {
        let p = this.players[PID];
        if (PID == playersPID) {
          players[PID] = p.getInfo();
        } else if (this.knowsMemberships(this.players[playersPID])) {
          players[PID] = p.fascistInfo();
        } else {
          players[PID] = p.liberalInfo();
        }
      });
    }
    return players;
  }

  knowsMemberships(player) {
    //this.gameInfo.memberships is built when the game starts.
    //Therefore, only spectators that were in the game since the game started can see roles.
    if (
      player.membership === 1 || //Fascists
      (player.membership === 2 && this.gameInfo.style == 0) || //Hitler in 5-6 player game
      (player.isSpectating && player.omnipotent) //Spectators.
    ) {
      return true;
    } else return false;
  }

  newGame() {
    this.gameStatus = "ingame"
    this.initPlayers();
    this.policies.shuffleCards();
    this.initPlayerSignals();
    this.startNewRound();
    this.sendFullGameInfo();
    this.currentEvent = "chancellor pick";
    this.snapState();
    this.sendLatestState();
  }

  sendFullGameInfo() {
    Object.values(this.lobby.players).forEach((player) => {
      if (player.socket) {
        //Players can exist without their socket.
        player.socket.emit("full game info", this.getRoundInfo(player.PID));
      }
    });
  }

  latestRound() {
    if (this.rounds.length) {
      return this.rounds[this.rounds.length - 1];
    } else {
      return this.error("No rounds to send!");
    }
  }

  newRound(nextPresident = null, playersWereElected = true) {
    this.startNewRound(nextPresident, playersWereElected);
    this.sendLatestState();
  }

  startNewRound(nextPresident = null, playersWereElected = true) {
    //Each round has player info stored with it. (Maybe change this?)
    //Players don't change very much (Except on round-ending events).
    if (playersWereElected && !this.lobby.devMode) {
      this.previousPresPID = this.presidentPID;
      this.previousChanPID = this.chancellorPID;
    }
    if (this.nAlive < 4) {
      // For the edge case of playing with 5 people after 2 deaths
      this.previousPresPID = null;
      this.previousChanPID = null;
    }
    this.presidentPID = null;
    this.chancellorPID = null;
    //If the next president has been pre-chosen, change it. Doesn't effect the "presidentIndex".
    //Otherwise, go to the next viable president.
    if (nextPresident) {
      this.presidentPID = nextPresident;
    } else {
      let PID,
        player,
        previousPresident,
        nPlayers = this.gameInfo.order.length;
      previousPresident = this.presidentIndex;
      do {
        //Go to the next president and confirm they aren't dead. To avoid infinite looping, only do this until we're back where we started.
        this.presidentIndex = (this.presidentIndex + 1) % nPlayers;
        PID = this.gameInfo.order[this.presidentIndex];
        player = this.players[PID];
      } while (!player.alive && previousPresident != this.presidentIndex);
      this.presidentPID = this.gameInfo.order[this.presidentIndex];
    }
    //TODO: Change voting information to be stored in each player.
    this.votes = {};
    this.nVoted = 0;
    this.yesCount = 0;
    let newRound = {
      gameInfo: { ...this.gameInfo },
      players: this.getPlayerInfo(),
      states: [],
    };
    this.rounds.push(newRound);
    this.currentEvent = "chancellor pick";
    this.snapState();
    this.sendNewRound();
  }

  sendNewRound() {
    //Sends the latest round to all players.
    Object.values(this.players).forEach((player) => {
      if (!player.socket) {
        return;
      } else {
        player.socket.emit("new round", this.getRoundInfo(player.PID));
      }
    });
  }

  snapState() {
    //Captures current game state and puts it in the latest event for the current round.
    //Grabs all game info, as opposed to specifically grabbing what's changed (As was done in snapState()).
    let round = this.latestRound();
    let currentState = {
      currentEvent: this.currentEvent,
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
      investigatedName: this.investigatedName,
      victim: this.victim,
    };
    round.states.push(currentState);
  }

  latestState(PID = undefined) {
    //Sends the latest State of the game.
    //If a PID is passed, the most recent full player info will also be given.
    let round = this.latestRound();
    let state = round.states[round.states.length - 1];
    let player = this.players[PID];
    return { ...state, you: player && player.getInfo() };
  }

  sendLatestState() {
    // Sends latest game state to every player, as well as their state.
    // Excessive info is sent with latesEvent(),
    //    TODO: Make functions that process and send the differences between rounds.
    Object.values(this.players).forEach((player) => {
      if (!player.socket) {
        return;
      } else {
        let arg = {
          state: this.latestState(player.PID),
        };
        player.socket.emit("new state", arg);
      }
    });
  }

  activateGameSignals(player) {
    //Activates game signals for a socket.
    //If this is a  reconnect, it's assumed that this socket is linked to a player.
    let socket = player.socket;
    let theirPID = player.PID;

    socket.on("chancellor picked", (arg) => {
      let picked = arg.pickedChancellor;
      if (this.currentEvent != "chancellor pick") {
        return this.error("Event is not chancellor pick!");
      } else if (this.presidentPID != theirPID) {
        return this.error("Non-president called 'chancellor picked!'");
      } else if (
        this.previousChanPID == picked ||
        this.previousPresPID == picked ||
        theirPID == picked
      ) {
        return this.error("President picked themselves or previous officer!");
      } else if (!this.players[picked].alive) {
        return this.error("Dead men tell no tales!");
      }
      this.chancellorPID = picked;
      this.currentEvent = "chancellor vote";
      this.snapState();
      this.sendLatestState();
    });

    socket.on("cast vote", (arg) => {
      //arg.vote
      let player = this.players[theirPID];
      if (this.currentEvent != "chancellor vote") {
        return this.error("Vote cast at invalid time!");
      } else if (!player.alive) {
        return this.error("Dead men tell no tales!");
      }
      if (this.votes[theirPID] == 0 || this.votes[theirPID] == 1) {
        return this.error("Vote already exists!");
      }
      this.votes[theirPID] = arg.vote;
      this.nVoted++;
      if (arg.vote == true) {
        this.yesCount++;
      }
      //For now, repack the argument and send the UI event.
      let uiEventArg = {
        name: "player voted",
        PID: theirPID,
      };
      this.sendUIEvent(uiEventArg, theirPID, socket);
      //Send just to the player. We can skip error checking as we know all values exist.
      socket.emit("ui event", uiEventArg);
      if (this.nVoted >= this.nAlive) {
        let yesRatio = this.yesCount / this.nVoted;
        if (yesRatio <= 0.5) {
          //Marker is moved immediately, so it moves ASAP on the player's side.
          this.marker++;
          this.presidentPID = null;
          this.chancellorPID = null;
          this.currentEvent = "chancellor not voted";
          this.snapState();
          this.sendLatestState();
          setTimeout(() => this.checkMarker(), this.WAIT_TIME);
        } else {
          if (
            this.players[this.chancellorPID].membership == 2 &&
            this.fasBoard >= 3
          ) {
            return this.endGame(1, 1);
          } else {
            this.marker = 0;
            this.players[this.presidentPID].hand.policies = this.policies.draw(
              3
            );
            this.currentEvent = "president discard";
            this.snapState();
            this.sendLatestState();
            return;
          }
        }
      }
    });

    socket.on("president discarding", (arg) => {
      if (this.presidentPID != theirPID) {
        return this.error("Non-president trying to discard");
      } else if (this.currentEvent != "president discard") {
        return this.error("president discarding during invalid event!");
      }
      let president = this.players[theirPID];
      let chancellor = this.players[this.chancellorPID];
      let policies = [...president.hand.policies];
      president.hand.policies = [];
      let discarded = policies.splice(arg.policyIndex, 1)[0];
      chancellor.hand.policies = policies;
      this.policies.discard(discarded);
      this.currentEvent = "chancellor discard";
      this.snapState();
      this.sendLatestState();
    });

    socket.on("chancellor discarding", (arg) => {
      if (this.chancellorPID != theirPID) {
        return this.error("Non-chancellor trying to discard");
      } else if (this.currentEvent != "chancellor discard") {
        return this.error("chancellor discarding during invalid event!");
      } else if (arg.policyIndex > 1) {
        return this.error("Incorrect Policy Index!");
      }
      let chancellor = this.players[this.chancellorPID];
      let policies = [...chancellor.hand.policies];
      chancellor.hand.policies = [];
      let discarded = policies.splice(arg.policyIndex, 1)[0];
      this.policies.discard(discarded);
      this.enactPolicy(policies[0]);
    });

    socket.on("president done", () => {
      if (
        this.currentEvent != "president peek" &&
        this.currentEvent != "president investigated"
      ) {
        return this.error("Event isn't valid!");
      } else if (this.presidentPID != theirPID) {
        return this.error("Non-president sent 'done'");
      } else {
        this.newRound();
      }
    });

    socket.on("president picked", (arg) => {
      if (
        this.currentEvent != "president pick" ||
        this.presidentPID != theirPID
      ) {
        return this.error("Cannot pick president!");
      } else {
        this.newRound(arg.pickedPresident, true);
      }
    });

    socket.on("president investigate request", (arg) => {
      if (this.currentEvent != "president investigate") {
        return this.error("Event isn't Investigate!");
      } else if (this.presidentPID != theirPID) {
        return this.error("Non-president sent 'investigate request'");
      }
      let president = this.players[this.presidentPID];
      this.investigatedName = this.players[arg.investigated].username;
      let membership = this.players[arg.investigated].membership > 0 ? 1 : 0;
      president.hand.investigatedMembership = membership;
      this.currentEvent = "president investigated";
      this.snapState();
      this.sendLatestState();
    });

    socket.on("president kill request", (arg) => {
      if (this.currentEvent != "president kill") {
        return this.error("Event isn't Kill!");
      } else if (this.presidentPID != theirPID) {
        return this.error("Non-president sent 'kill request'");
      }
      this.victim = arg.victim;
      let player = this.players[arg.victim];
      player.alive = false;
      this.nAlive--;
      if (player.membership == 2) {
        return this.endGame(0, 1);
      }
      this.currentEvent = "player killed";
      this.snapState();
      this.sendLatestState();
      setTimeout(() => {
        this.newRound();
      }, this.WAIT_TIME);
    });

    socket.on("veto request", (arg) => {
      if (
        this.currentEvent != "chancellor discard" ||
        this.chancellorPID != theirPID ||
        this.fasBoard != 5
      ) {
        return this.error("This player cannot veto now!");
      }
      let chancellor = this.players[this.chancellorPID];
      let policies = [...chancellor.hand.policies];
      this.policies.discard(policies[arg.policyIndex]);
      policies.splice(arg.policyIndex, 1);
      //TODO: put this somewhere besides remainingpolicy.
      this.remainingPolicy = policies[0];
      this.currentEvent = "veto requested";
      this.snapState();
      this.sendLatestState();
    });

    socket.on("confirm veto request", (arg) => {
      if (
        this.currentEvent != "veto requested" ||
        this.presidentPID != theirPID ||
        this.fasBoard != 5
      ) {
        return this.error("This player cannot confirm veto now!");
      }
      let remainingPolicy = this.remainingPolicy;
      if (arg.isJa) {
        this.currentEvent = "veto accepted";
        this.policies.discard(remainingPolicy);
        setTimeout(() => {
          this.newRound();
        }, this.WAIT_TIME);
      } else {
        this.currentEvent = "veto denied";
        setTimeout(() => {
          this.enactPolicy(remainingPolicy);
        }, this.WAIT_TIME);
      }
      this.remainingPolicy = null;
      this.snapState();
      this.sendLatestState();
    });

    socket.on("send ui info", (arg) => this.sendUIEvent(arg, theirPID, socket));
  }

  sendUIEvent(arg, theirPID, socket) {
    //Required UI arguments for each UI event.
    //If an event is missing any of their arguments, then shoot an error.
    const uiArgs = {
      "select player": ["PID"],
      "player voted": ["PID"],
    };
    const uiReqs = {
      "select player": this.presidentPID == theirPID,
      "player voted": true, //Only called when allowed.
    };
    if (!arg || !arg.name) {
      return this.error("arg or arg name is undefined.");
    }
    let requiredArgs = uiArgs[arg.name];
    let givenArgs = new Set(Object.keys(arg));
    let canSendEvent = uiReqs[arg.name];
    for (let arg of requiredArgs) {
      if (!givenArgs.has(arg)) {
        return this.error(`Missing arg in ui info: ${arg}`);
      }
    }
    if (!canSendEvent) {
      return this.error("Ui info requirements not met!");
    }
    socket.broadcast.emit("ui event", arg);
  }

  enactPolicy(value) {
    //enacting a policy checks for executive actions. Placing a policy does not.
    //These need to be different things because policies can be placed without someone obtaining executive action.
    let endedGame = this.placePolicy(value);
    if (!endedGame) {
      //Wait WAIT_TIME before continuing the game.
      setTimeout(() => {
        if (value == 1 && this.getExecutiveAction()) {
          this.currentEvent = this.getExecutiveAction();
          if (this.currentEvent == "president peek") {
            let president = this.players[this.presidentPID];
            president.hand.policies = this.policies.view(3);
          }
          this.snapState();
          this.sendLatestState();
        } else {
          this.newRound();
        }
      }, this.WAIT_TIME);
    }
    return;
  }

  getExecutiveAction() {
    let board56, board78, board910;
    board56 = [
      null,
      null,
      null,
      "president peek",
      "president kill",
      "president kill",
    ];
    board78 = [
      null,
      null,
      "president investigate",
      "president pick",
      "president kill",
      "president kill",
    ];
    board910 = [
      null,
      "president investigate",
      "president investigate",
      "president pick",
      "president kill",
      "president kill",
    ];
    if (this.gameInfo.style == 0) {
      //5-6 players
      return board56[this.fasBoard];
    } else if (this.gameInfo.style == 1) {
      //7-8 players
      return board78[this.fasBoard];
    } else {
      // 9-10 players
      return board910[this.fasBoard];
    }
  }

  placePolicy(value) {
    //Places a policy, and sends the placed policy event. Returns 1 if somebody won.
    //Doesn't cause presidential policy events.
    if (value == 1) {
      this.fasBoard++;
      if (this.fasBoard >= 6) {
        this.endGame(1, 0);
        return 1;
      }
    } else if (value == 0) {
      this.libBoard++;
      if (this.libBoard >= 5) {
        this.endGame(0, 0);
        return 1;
      }
    } else {
      return this.error(`Policy was ${value}, not 1 or 0!`);
    }
    if (value == 1) {
      this.currentEvent = "fascist policy placed";
    } else {
      this.currentEvent = "liberal policy placed";
    }
    this.snapState();
    this.sendLatestState();
    return 0;
  }

  checkMarker() {
    let endedGame, drawnPolicy;
    if (this.marker == 3) {
      this.marker = 0;
      drawnPolicy = this.policies.draw(1)[0];
      endedGame = this.placePolicy(drawnPolicy);
    }
    if (!endedGame) {
      setTimeout(() => this.newRound(false, false), this.WAIT_TIME);
    }
  }

  endGame(winner, reason) {
    //winner: 0 = liberal, 1 = fascist.
    //Reasons: 0 = cards, 1 = killed/elected hitler.
    let endGame = [
      ["liberal win cards", "liberal win hitler"],
      ["fascist win cards", "fascist win hitler"],
    ];
    this.currentEvent = "end game";
    this.rounds.push({
      gameInfo: { ...this.gameInfo },
      players: this.getPlayerInfo(),
      states: [],
      reason: endGame[winner][reason],
    });
    this.snapState();
    this.gameStatus = "postgame";
    this.io.emit("end game", { endState: this.latestRound() });
  }
}

function shuffle(a) {
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
