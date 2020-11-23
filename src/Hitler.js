import React from "react";
import io from "socket.io-client";

import { LibBoard, FasBoard } from "./parts/gameParts/Boards";
import ActionBar from "./parts/gameParts/ActionBar";
import StatusBar from "./parts/gameParts/StatusBar";
import PlayerSidebar from "./parts/gameParts/PlayerSidebar";
import PlayerCard from "./parts/gameParts/PlayerCard";
import EndWindow from "./parts/gameParts/EndWindow";

import defaultGameState from "./parts/gameParts/context/defaultState";
import defaultState from "./parts/gameParts/context/defaultState";

export default class Hitler extends React.Component {
  constructor(props) {
    super(props);
    this.state = defaultGameState;
    this.clearUIInfo = this.clearUIInfo.bind(this);
    this.sendUIInfo = this.sendUIInfo.bind(this);
    this.recieveUIInfo = this.recieveUIInfo.bind(this);
    this.joinNewLobby = this.joinNewLobby.bind(this);
    this.activateGameSignals = this.activateGameSignals.bind(this);
  }
  clearUIInfo() {
    let uiInfo = {
      selectedPlayer: null,
      voteReceived: false,
      voted: {},
    };
    this.setState({
      uiInfo: uiInfo,
    });
  }
  sendUIInfo(arg) {
    //arg contains arg.name and other required arg info.
    //All shared UI events pass are sent to other players.
    //The info is broadcast to all other players, but updates instantly on the player's side.
    this.props.socket.emit("send ui info", arg);
    this.recieveUIInfo(arg);
  }
  recieveUIInfo(arg) {
    const uiInfo = this.state.uiInfo;
    switch (arg.name) {
      case "player voted":
        uiInfo.voted[arg.PID] = true;
        break;
      case "select player":
        uiInfo.selectedPlayer = arg.PID;
        break;
      default:
        break;
    }
    this.setState({
      uiInfo: uiInfo,
    });
  }

  joinNewLobby() {
    this.props.socket.emit("join new lobby");
  }

  componentDidMount() {
    this.activateGameSignals();
  }
  componentDidUpdate(prevProps) {
    if (this.props.socket != prevProps.socket) {
      this.activateGameSignals();
    }
  }

  activateGameSignals() {
    let socket = this.props.socket;
    socket.on("full game info", (arg) => {
      this.setState({
        rounds: [arg.round],
      });
    });
    socket.on("new round", (arg) => {
      const rounds = this.state.rounds;
      let newRound = arg.round;
      this.clearUIInfo();
      this.setState({
        rounds: rounds.concat([newRound]),
      });
    });
    socket.on("new state", (arg) => {
      const rounds = this.state.rounds;
      const states = rounds[rounds.length - 1].states;
      rounds[rounds.length - 1].states = states.concat([arg.state]);
      this.clearUIInfo();
      this.setState({
        rounds: rounds,
      });
    });
    socket.on("end game", (arg) => {
      let endState = arg.endState;
      const rounds = this.state.rounds;
      this.setState({
        rounds: rounds.concat([endState]),
      });
    });
    //Sent by the player with the bullet.
    socket.on("ui event", (arg) => this.recieveUIInfo(arg));
  }

  getPlayerAction(currentState) {
    //Based on event info, constructs the 'action' for the specific player.
    //The action guides what shows up in the action bar, as well as the game status message.
    let action = "";
    let youArePresident = this.props.yourPID == currentState.presidentPID;
    let youAreChancellor = this.props.yourPID == currentState.chancellorPID;
    switch (currentState.currentEvent) {
      case "chancellor pick":
        action = youArePresident ? "your chancellor pick" : "chancellor pick";
        break;
      case "president discard":
        action = youArePresident
          ? "your president discard"
          : "president discard";
        break;
      case "chancellor discard":
        action = youAreChancellor
          ? "your chancellor discard"
          : "chancellor discard";
        break;
      case "veto requested":
        action = youArePresident ? "your veto requested" : "veto requested";
        break;
      case "president peek":
        action = youArePresident ? "your president peek" : "president peek";
        break;
      case "president pick":
        action = youArePresident ? "your president pick" : "president pick";
        break;
      case "president kill":
        action = youArePresident ? "your president kill" : "president kill";
        break;
      case "president investigate":
        action = youArePresident
          ? "your president investigate"
          : "president investigate";
        break;
      case "president investigated":
        action = youArePresident
          ? "your president investigated"
          : "president investigated";
        break;
      case "end game":
        action = event.reason;
        break;
      default:
        action = currentState.currentEvent;
        break;
    }
    return action;
  }

  render() {
    let rounds = this.state.rounds;
    let round = rounds[rounds.length - 1];
    let currentState = round.states[round.states.length - 1];
    currentState.action = this.getPlayerAction(currentState);
    let you = currentState.you || round.players[this.props.yourPID];
    let players = round.players;
    let order = round.gameInfo.order;
    let aliveAndPlaying = you && you.alive;

    return (
      <div className="game-window">
        <StatusBar
          lobbyID={this.props.lobbyID}
          currentState={currentState}
          players={players}
        />
        <PlayerCard you={you} />
        <PlayerSidebar
          order={order}
          currentState={currentState}
          reason={round.reason || null}
          you={you}
          players={players}
          uiInfo={this.state.uiInfo}
          sendUIInfo={this.sendUIInfo}
        />
        <div className="boards">
          <div className="board-container">
            <LibBoard
              draw={currentState.nInDraw}
              discard={currentState.nInDiscard}
              marker={currentState.marker}
              nCards={currentState.libBoard}
            />
            <FasBoard nCards={currentState.fasBoard} nPlayers={order.length} />
          </div>
        </div>
        {aliveAndPlaying && (
          <ActionBar
            socket={this.props.socket}
            currentState={currentState}
            players={players}
            you={you}
            leaveLobby={this.props.leaveLobby}
            uiInfo={this.state.uiInfo}
          />
        )}
        {currentState.currentEvent == "end game" && (
          <EndWindow
            reason={round.reason}
            leaveLobby={this.props.leaveLobby}
            joinNewLobby={() => this.joinNewLobby()}
          />
        )}
      </div>
    );
  }
}
// export default hot(Hitler) //HOT HITLER?!?!
