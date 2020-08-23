import React, { Suspense } from "react";
import io from "socket.io-client";

import Header from "./parts/Header.js";
import ChatRoom from "./parts/ChatRoom.js";
import SingleInputForm from "./parts/SingleInputForm";
//Lazy Load the game in the background, as it is not neccessary for loading the lobby.
const Game = React.lazy(() => import("./Hitler.js"));
// import {default as Game} from './Hitler.js';

export default class Lobby extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.getDefaultState();
    this.disconnector = null;
    this.CONNECT_TIME = 5000;
    this.leaveLobby = this.leaveLobby.bind(this);
    this.kickPlayer = this.kickPlayer.bind(this);
    this.connect = this.connect.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.startGame = this.startGame.bind(this);
    this.spectateGame = this.spectateGame.bind(this);
  }
  getDefaultState() {
    const socket = io(
      this.props.socketURL + "/" + this.props.lobbyID.toLowerCase(),
      {
        reconnection: true,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        forceNew: true,
      }
    );
    return {
      socket: socket,
      gameInfo: null,
      PID: null,
      lobbyExists: false,
      inLobby: false,
      players: {},
      gameInfo: null,
      nSpectators: 0,
      isSpectating: false,
    };
  }

  componentDidMount() {
    this.initializeSignals(this.state.socket);
  }

  componentDidUpdate(prevProps) {
    if (this.props.lobbyID != prevProps.lobbyID) {
      this.state.socket.close();
      let defaultState = this.getDefaultState();
      this.setState(defaultState);
      this.initializeSignals(defaultState.socket);
    }
  }

  componentWillUnmount() {
    this.state.socket.close();
    clearTimeout(this.disconnector);
  }

  initializeSignals(socket) {
    // If the lobby isn't connecting, we shouldn't stick around.
    clearTimeout(this.disconnector);
    this.disconnector = setTimeout(
      () => this.leaveLobby("Lobby Doesn't Exist!"),
      this.CONNECT_TIME
    );
    socket.on("lobby init info", (arg) => {
      this.setState({
        lobbyExists: true,
        players: arg.initInfo.players,
        gameInfo: arg.initInfo.gameInfo,
      });
    });

    socket.on("lobby joined", (arg) => {
      this.setState({
        inLobby: true,
        PID: arg.PID,
      });
    });

    socket.on("change lobby", (arg) => {
      this.leaveLobby();
      this.props.setLobbyID(arg.ID, true);
    });

    socket.on("kick", () =>
      this.leaveLobby("You've been kicked From the lobby!")
    );

    socket.on("lobby update info", (arg) => {
      this.setState({
        players: arg.lobbyInfo.players,
        gameInfo: arg.lobbyInfo.gameInfo,
        nSpectators: arg.lobbyInfo.nSpectators,
      });
    });

    socket.on("reconnect_failed", () => {
      this.leaveLobby(`Lost Connection to ${this.props.lobbyID}`);
    });

    socket.on("alert", (alert) => {
      this.props.setAlert(alert);
    });
    //establishing lobby connection needs to occur After signals have been triggered.
    socket.on("connect", () => {
      clearTimeout(this.disconnector);
      socket.emit("connection init request");
    });
  }
  leaveLobby(reason = null) {
    if (reason) {
      this.props.setAlert(reason);
    }
    this.props.setLobbyID();
  }
  connect(username) {
    this.state.socket.emit("join lobby", {
      username: username,
    });
  }

  reconnect(PID) {
    let arg = {
      PID: PID,
    };
    this.state.socket.emit("rejoin lobby", arg);
  }

  kickPlayer(PID) {
    const you = this.state.players[this.state.PID];
    if (you.isLeader) {
      this.state.socket.emit("request kick", {
        kickee: PID,
      });
    }
  }
  startGame() {
    this.state.socket.emit("game init");
  }
  spectateGame() {
    this.state.socket.emit("spectator init");
    this.setState({
      isSpectating: true,
    });
  }
  render() {
    let navButtons;
    const lobbyID = this.props.lobbyID;
    const lobbyExists = this.state.lobbyExists;
    const inLobby = this.state.inLobby;
    const gameInfo = this.state.gameInfo;
    const players = this.state.players;
    const you = players && players[this.state.PID];
    const isLeader = you && you.isLeader;
    const spectating = this.state.isSpectating;
    if (!inLobby) {
      if (lobbyExists) {
        navButtons = (
          <div>
            <button className="menu-exit" onClick={this.leaveLobby}>
              Return to Menu
            </button>
            <button className="spectate" onClick={this.spectateGame}>
              Spectate With{gameInfo && gameInfo.isRunning && "out"} Roles
            </button>
          </div>
        );
      } else {
        navButtons = (
          <button className="menu-exit" onClick={this.leaveLobby}>
            Return to Menu
          </button>
        );
      }
    } else if (isLeader) {
      navButtons = (
        <button className="game-start" onClick={this.startGame}>
          Start Game
        </button>
      );
    }
    return (
      <div className="window">
        {(!inLobby || !gameInfo.isRunning) && (
          <div className={`lobby-window`}>
            <div className="wave-background" />
            <div className="content">
              <div className="background" />
              <Header lobbyID={lobbyID} />
              <LobbyStatus
                connect={this.connect}
                gameInfo={gameInfo}
                lobbyExists={lobbyExists}
                inLobby={inLobby}
              />
              <LobbyPlayerList
                PID={this.state.PID}
                players={players}
                reconnect={this.reconnect}
                kickPlayer={this.kickPlayer}
              />
              <div className="bottom-button">{navButtons}</div>
              <div className="num-spectators">
                <h3>Spectators: {this.state.nSpectators}</h3>
              </div>
            </div>
          </div>
        )}
        <Suspense fallback={<div className="game-window"></div>}>
          {/* Lazy Loading Game Files */}
          <Game
            lobbyID={lobbyID}
            spectating={spectating}
            yourPID={this.state.PID}
            leaveLobby={this.leaveLobby}
            socket={this.state.socket}
          />
        </Suspense>
        {inLobby && (
          <ChatRoom
            socket={this.state.socket}
            you={you}
            spectating={spectating}
          />
        )}
      </div>
    );
  }
}

class NewPlayerForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
    };
    this.MAX_LENGTH = 30; //30 is generous CHRIS >:(
    this.join = this.join.bind(this);
  }
  join(username) {
    if (username != "") {
      this.props.connect(username);
    }
  }
  render() {
    return (
      <div className="new-player-form">
        <SingleInputForm
          className="username-input"
          button="Join"
          MAX_LENGTH={this.MAX_LENGTH}
          submit={this.join}
        >
          <label>Enter your Name:</label>
        </SingleInputForm>
      </div>
    );
  }
}

function LobbyStatus(props) {
  let status;
  if (!props.lobbyExists) {
    status = <h2>Loading Lobby...</h2>;
  } else if (props.gameInfo && props.gameInfo.isRunning) {
    status = <h2>Game in Progress!</h2>;
  } else if (props.inLobby) {
    status = null;
  } else {
    status = <NewPlayerForm connect={props.connect}></NewPlayerForm>;
  }
  return <div className="lobby-status">{status}</div>;
}

function ReconnectPlayerForm(props) {
  if (!props.players) {
    return null;
  }
  let iterablePlayers = Object.values(props.players);
  let disconnectedPlayers = iterablePlayers.map((player) =>
    !player.connected ? (
      <div
        key={player.username}
        onClick={() => {
          props.reconnect(player.PID);
        }}
      >
        {player.username}
      </div>
    ) : null
  );
  return (
    <div className="rejoin-form">
      <h2>Game in Progress!</h2>
      {disconnectedPlayers.length && disconnectedPlayers}
    </div>
  );
}

function LoadingMessage(props) {
  return (
    <div className="loading-message">
      <h3 className="loading-status">Connecting... (Lobby might not exist!)</h3>
      <button onClick={props.leaveLobby}>Return to Menu</button>
    </div>
  );
}

function LobbyPlayerList(props) {
  let yourPID = props.PID;
  let you = props.players ? props.players[yourPID] : null;
  let iterablePlayers = Object.values(props.players);
  let connectedPlayers,
    disconnectedPlayers = [null, null];
  let nDisconnectedPlayers = 0;
  if (props.players) {
    //Counting the disconnected Players using a nasty one-liner
    iterablePlayers.forEach((player) => {
      if (player.connected == false) {
        nDisconnectedPlayers++;
      }
    });
    //Creating the list of connected Players
    connectedPlayers = iterablePlayers.map(
      (player) =>
        player.connected && (
          <li
            key={player.username}
            className={
              (player.isLeader ? "leader " : "") +
              (player.PID == yourPID ? "you " : "")
            }
          >
            {player.username}
            {you && you.isLeader && player.PID != yourPID && (
              <button
                className="kick-button"
                onClick={() => props.kickPlayer(player.PID)}
              >
                Kick
              </button>
            )}
          </li>
        )
    );

    //Creating the list of Disconnected Players
    disconnectedPlayers = iterablePlayers.map(
      (player) =>
        !player.connected && (
          <li
            key={player.username}
            className="disconnected"
            onClick={() => {
              props.reconnect(player.PID);
            }}
          >
            {player.username}
            {you && you.isLeader && player.PID != yourPID && (
              <button
                className="kick-button"
                onClick={() => props.kickPlayer(player.PID)}
              >
                Kick
              </button>
            )}
          </li>
        )
    );
  }
  return (
    <div className="player-list">
      {true ? (
        <div className="connected-players">
          <h3>Connected Players:</h3>
          <ul>{connectedPlayers}</ul>
        </div>
      ) : null}
      {nDisconnectedPlayers > 0 ? (
        <div className="disconnected-players">
          <hr />
          <h3>Disconnected Players:</h3>
          <ul>{disconnectedPlayers}</ul>
        </div>
      ) : null}
    </div>
  );
}
