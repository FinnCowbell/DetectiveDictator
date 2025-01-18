import React from "react";
import Header from "./parts/Header.js";
import ChatRoom from "./parts/ChatRoom.js";
import SingleInputForm from "./parts/SingleInputForm";
import WaveBackground from "./rendering/WaveBackground";
import Hitler from './Hitler.js';
import { useLobbyContext, setLocalStorage, getLocalStorage, LOBBY_MAPPING_KEY } from "./LobbyContext.js";
import FireBackground from "./rendering/FireBackground.js";
import presHat from "./media/sidebar/president-hat.png";

const storeReconnectPID = (lobbyID, PID) => {
  setLocalStorage(LOBBY_MAPPING_KEY, { [lobbyID]: PID });
}

export const getReconnectPID = (lobbyID) => {
  const lobbyMapping = getLocalStorage(LOBBY_MAPPING_KEY) || {};
  return lobbyMapping[lobbyID]
}

export const Lobby = () => {
  const { lobbyID, socket, setAlertMessage, setLobbyID, connected } = useLobbyContext();
  const [gameInfo, setGameInfo] = React.useState(null)
  const [PID, setPID] = React.useState(null)
  const [lobbyExists, setLobbyExists] = React.useState(false)
  const [inLobby, setInLobby] = React.useState(false)
  const [players, setPlayers] = React.useState({})
  const [nSpectators, setNSpectators] = React.useState(0)
  const [isSpectating, setIsSpectating] = React.useState(false)
  const [joinedBeforeGame, setjoinedBeforeGame] = React.useState(false)

  const defaultState = () => {
    setGameInfo(null);
    setPID(null);
    setLobbyExists(false);
    setInLobby(false);
    setPlayers({});
    setNSpectators(0);
    setIsSpectating(false);
  }

  const leaveLobby = (reason = null) => {
    if (reason) {
      setAlertMessage(reason);
    }
    setLobbyID('');
  }

  const connect = (username) =>
    socket.emit("join lobby", {
      username: username,
    });

  const reconnect = (PID) => {
    socket.emit("rejoin lobby", {
      PID: PID,
    });
  }

  const kickPlayer = (PID) => {
    socket.emit("request kick", {
      kickee: PID,
    });
  }

  const startGame = () => socket.emit("game init");

  const spectateGame = () => {
    socket.emit("spectator init");
    setIsSpectating(true);
  }

  React.useEffect(() => {
    if (lobbyID && socket) {
      socket.on("lobby joined", ({ PID, isSpectating }) => {
        setInLobby(true);
        setPID(PID);
        setIsSpectating(isSpectating);
      });

      socket.on("change lobby", (arg) => {
        leaveLobby();
        setLobbyID(arg.ID, true);
      });

      socket.on("kick", () =>
        leaveLobby("You've been kicked From the lobby!")
      );

      socket.on("lobby update info", (arg) => {
        if (!lobbyExists) {
          document
            .querySelector(".lobby-window .wave-background")
            ?.classList.add("fade");
        }
        setLobbyExists(true)
        setPlayers(arg.lobbyInfo.players)
        setGameInfo(arg.lobbyInfo.gameInfo)
        setNSpectators(arg.lobbyInfo.nSpectators)
      });

      //establishing lobby connection needs to occur After signals have been triggered.
      socket.on("connect", () => {
        socket.emit("connection init request");
      });
    }
  }, [lobbyID, socket]);

  React.useEffect(() => {
    if (gameInfo?.gameStatus === 'ingame') {
      const reconnectPID = getReconnectPID(lobbyID)
      if (!PID && reconnectPID) {
        reconnect(reconnectPID);
      } else if (PID && (!isSpectating || joinedBeforeGame)) {
        storeReconnectPID(lobbyID, PID);
      }
    } else if (gameInfo?.gameStatus === 'pregame' && PID) {
      setjoinedBeforeGame(true);
    }
  }, [gameInfo?.gameStatus, PID])

  // Sloppy reset 
  React.useEffect(() => {
    defaultState();
  }, [lobbyID])

  let navButtons;
  const you = players && players[PID];
  const isLeader = you && you.isLeader;
  if (!inLobby) {
    if (lobbyExists) {
      navButtons = (
        <div>
          <button className="menu-exit" onClick={() => leaveLobby()}>
            Return to Menu
          </button>
          {gameInfo?.gameStatus !== "postgame" ?
            <button className="spectate" onClick={spectateGame}>
              {`Spectate ${gameInfo?.gameStatus == "ingame" ? "without" : "with"} Roles`}
            </button> :
            <button className="menu-exit" onClick={() => socket.emit("join new lobby")}>
              Join Next Game
            </button>
          }
        </div >
      );
    } else {
      navButtons = (
        <button className="menu-exit" onClick={() => leaveLobby()}>
          Return to Menu
        </button>
      );
    }
  } else if (isLeader) {
    navButtons = (
      <button className="game-start" onClick={startGame}>
        Start Game
      </button>
    );
  }
  return (
    <div className="window" style={{ ['--president-hat']: `url(${presHat})` }}>
      {(!inLobby || gameInfo.gameStatus == "pregame") && (
        <div className={`lobby-window`}>
          {!connected && <FireBackground />}
          <WaveBackground toggle={lobbyID} />
          <div className="content">
            <div className="background" />
            <Header lobbyID={lobbyID} />
            <LobbyStatus
              connect={connect}
              gameInfo={gameInfo}
              lobbyExists={lobbyExists}
              inLobby={inLobby}
            />
            {connected && <LobbyPlayerList
              PID={PID}
              players={players}
              reconnect={reconnect}
              kickPlayer={kickPlayer}
            />}
            <div className="bottom-button">{navButtons}</div>
            <div className="num-spectators">
              {lobbyExists && <h3>Spectators: {nSpectators}</h3>}
            </div>
          </div>
        </div>
      )}
      {socket && (
        <Hitler
          lobbyID={lobbyID}
          spectating={isSpectating}
          yourPID={PID}
          socket={socket}
        />
      )}
      {inLobby && (
        <ChatRoom
          socket={socket}
          you={you}
          spectating={isSpectating}
        />
      )}
    </div>
  );
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
    status = <h2>Loading Lobby <div className="dots" /></h2>;
  } else if (props.gameInfo && props.gameInfo.gameStatus == "ingame") {
    status = <h2>Game in Progress!</h2>;
  } else if (props.gameInfo && props.gameInfo.gameStatus == "postgame") {
    status = <h2>The game has ended.</h2>;
  } else if (props.inLobby) {
    status = null;
  } else {
    status = <NewPlayerForm connect={props.connect}></NewPlayerForm>;
  }
  return <div className="lobby-status">{status}</div>;
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
                🥾
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
          <h3>Disconnected Players:</h3>
          <ul>{disconnectedPlayers}</ul>
        </div>
      ) : null}
    </div>
  );
}

export default Lobby;