import React from "react";
import Header from "./parts/Header";
import ChatRoom from "./parts/ChatRoom";
import SingleInputForm from "./parts/SingleInputForm";
import WaveBackground from "./rendering/WaveBackground";
import Hitler from './Hitler';
import { useLobbyContext, setLocalStorage, getLocalStorage, LOBBY_MAPPING_KEY } from "./LobbyContext";
import FireBackground from "./rendering/FireBackground";
import presHat from "./media/sidebar/president-hat.png";
import { PID } from "./model/Player";
import { PlayerMap } from "./model/GameState";

const storeReconnectPID = (lobbyID: string, PID: PID) => {
  setLocalStorage(LOBBY_MAPPING_KEY, { [lobbyID]: PID });
}

export function getReconnectPID(lobbyID: string): PID | undefined {
  const lobbyMapping = getLocalStorage(LOBBY_MAPPING_KEY) || {};
  return lobbyMapping[lobbyID]
}

export const Lobby = () => {
  const { lobbyID, socket, setAlertMessage, setLobbyID, connected } = useLobbyContext();
  const [gameInfo, setGameInfo] = React.useState<{ gameStatus: string }>()
  const [PID, setPID] = React.useState<PID | undefined>()
  const [lobbyExists, setLobbyExists] = React.useState(false)
  const [inLobby, setInLobby] = React.useState(false)
  const [players, setPlayers] = React.useState<PlayerMap>({})
  const [nSpectators, setNSpectators] = React.useState(0)
  const [isSpectating, setIsSpectating] = React.useState(false)
  const [joinedBeforeGame, setjoinedBeforeGame] = React.useState(false)

  const defaultState = () => {
    setGameInfo(undefined);
    setPID(undefined);
    setLobbyExists(false);
    setInLobby(false);
    setPlayers({});
    setNSpectators(0);
    setIsSpectating(false);
  }

  const leaveLobby = (message?: string) => {
    if (message) {
      setAlertMessage(message);
    }
    setLobbyID('');
  }

  const connect = (username: string) =>
    socket?.emit("join lobby", {
      username: username,
    });

  const reconnect = (PID: PID) => {
    socket?.emit("rejoin lobby", {
      PID: PID,
    });
  }

  const kickPlayer = (PID: PID) => {
    socket?.emit("request kick", {
      kickee: PID,
    });
  }

  const startGame = () => socket?.emit("game init");

  const spectateGame = () => {
    socket?.emit("spectator init");
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
        setLobbyID(arg.ID);
      });

      socket.on("kick", () =>
        leaveLobby("You've been kicked From the lobby!")
      );

      socket.on("lobby update info", (arg: {
        lobbyInfo: {
          players: PlayerMap,
          gameInfo: { gameStatus: string },
          nSpectators: number
        }
      }) => {
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
    if (gameInfo?.gameStatus === 'ingame' && lobbyID) {
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

  // Reset on lobby change
  React.useEffect(() => {
    defaultState();
  }, [lobbyID])

  let navButtons;
  const you = players && PID && players[PID];
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
            <button className="menu-exit" onClick={() => socket?.emit("join new lobby")}>
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
    //@ts-ignore
    <div className="window" style={{ ['--president-hat']: `url(${presHat})` }}>
      {(!inLobby || gameInfo?.gameStatus == "pregame") && (
        <div className={`lobby-window`}>
          {!connected && <FireBackground />}
          <WaveBackground toggle={!!lobbyID} />
          <div className="content">
            <div className="background" />
            <Header />
            <LobbyStatus
              connect={connect}
              gameInfo={gameInfo}
              lobbyExists={lobbyExists}
              inLobby={inLobby}
            />
            {connected && PID && <LobbyPlayerList
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
      {socket && lobbyID && PID && (
        <Hitler
          lobbyID={lobbyID}
          yourPID={PID}
          socket={socket}
        />
      )}
      {inLobby && (
        <ChatRoom
          socket={socket}
          spectating={isSpectating}
        />
      )}
    </div>
  );
}

const NewPlayerForm: React.FC<{
  connect: (username: string) => void
}> = ({ connect }) => {
  const join = (name: string) => {
    if (name != "") {
      connect(name);
    }
  }
  return (
    <div className="new-player-form">
      <SingleInputForm
        className="username-input"
        button="Join"
        MAX_LENGTH={30}//30 is generous CHRIS >:(
        submit={join}
      >
        <label>Enter your Name:</label>
      </SingleInputForm>
    </div>
  );

}

const LobbyStatus: React.FC<{
  connect: (username: string) => void,
  lobbyExists: boolean,
  gameInfo?: { gameStatus: string },
  inLobby: boolean
}> = (props) => {
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

const LobbyPlayerList: React.FC<{
  PID: PID,
  players: PlayerMap,
  reconnect: (PID: PID) => void,
  kickPlayer: (PID: PID) => void
}> = (props) => {
  let yourPID = props.PID;
  let you = props.players ? props.players[yourPID] : null;
  let iterablePlayers = Object.values(props.players);
  let nDisconnectedPlayers = iterablePlayers.filter(({ connected }) => !connected).length;
  //Creating the list of connected Players
  const connectedPlayers: JSX.Element[] = iterablePlayers.map(
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
  const disconnectedPlayers = iterablePlayers.map(
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