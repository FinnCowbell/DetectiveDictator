import React from "react";
import Header from "./parts/Header";
import ChatRoom from "./parts/ChatRoom";
import SingleInputForm from "./parts/SingleInputForm";
import WaveBackground from "./rendering/WaveBackground";
import Hitler from './Hitler';
import { useSocketContext, setLocalStorage, getLocalStorage, LOBBY_MAPPING_KEY, clearLobbyMapping } from "./SocketContext";
import FireBackground from "./rendering/FireBackground";
import presHat from "./media/sidebar/president-hat.png";
import { PID } from "./model/Player";
import { PlayerMap } from "./model/GameState";
import { GameContextProvider } from "./GameDetails";
import { useIsMobile } from "./hooks/useIsMobile";
import { useMobileViewportStyles } from "./hooks/useMobileViewportStyles";

const storeReconnectPID = (lobbyID: string, PID: PID) => {
  setLocalStorage(LOBBY_MAPPING_KEY, { [lobbyID]: PID });
}

export function getReconnectPID(lobbyID: string): PID | undefined {
  const lobbyMapping = getLocalStorage(LOBBY_MAPPING_KEY) || {};
  return lobbyMapping[lobbyID]
}

export const Lobby = () => {
  const { lobbyID, socket, setAlertMessage, setLobbyID, connected } = useSocketContext();
  useMobileViewportStyles();
  const [gameInfo, setGameInfo] = React.useState<{ gameStatus: string } | undefined>()
  const [PID, setPID] = React.useState<PID | undefined>()
  const [lobbyExists, setLobbyExists] = React.useState(false)
  const [players, setPlayers] = React.useState<PlayerMap>({})
  const [nSpectators, setNSpectators] = React.useState(0)
  const [isSpectating, setIsSpectating] = React.useState<boolean>(false)
  const [joinedBeforeGame, setjoinedBeforeGame] = React.useState(false)
  const isMobile = useIsMobile();

  const inLobby = !!PID;

  const defaultState = () => {
    setGameInfo(undefined);
    setPID(undefined);
    setLobbyExists(false);
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
      defaultState();
      socket.on("lobby joined", ({ PID, isSpectating }) => {
        // Store PID in local storage
        if (isSpectating === false) {
          storeReconnectPID(lobbyID, PID);
        }
        setPID(PID);
        setIsSpectating(isSpectating);
      });

      socket.on("change lobby", (arg) => {
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

      socket.on("connection lost", () => {
        const PID: PID | undefined = getReconnectPID(lobbyID);
        if (PID) {
          socket.emit("rejoin lobby", { PID });
        } else {
          setAlertMessage("Connection Lost!");
          setLobbyID('');
        }
      });
    }
  }, [lobbyID, socket]);

  React.useEffect(() => {
    if (PID && !joinedBeforeGame && gameInfo?.gameStatus === 'pregame') {
      setjoinedBeforeGame(true);
    }

    if (socket && PID && lobbyID && !isSpectating && joinedBeforeGame && gameInfo?.gameStatus !== 'postgame') {
      storeReconnectPID(lobbyID, PID);
    }

    if (socket && !PID && lobbyID && lobbyExists && gameInfo?.gameStatus !== 'postgame') {
      const reconnectPID = getReconnectPID(lobbyID)
      if (reconnectPID) {
        clearLobbyMapping(lobbyID);
        reconnect(reconnectPID);
      }
    }
  }, [gameInfo?.gameStatus, lobbyID, lobbyExists, isSpectating, joinedBeforeGame, PID, socket])

  const you = players && PID && players[PID];
  const isLeader = you && you.isLeader;
  const navButtons: JSX.Element[] = [
    <button key='menu' className="menu-exit" onClick={() => leaveLobby()}>
      Menu
    </button>
  ];
  if (!inLobby && lobbyExists) {
    if (gameInfo?.gameStatus !== "postgame") {
      navButtons.push(
        <button key='spectate' className="spectate" onClick={spectateGame}>
          {`Spectate ${gameInfo?.gameStatus == "ingame" ? "without" : "with"} Roles`}
        </button>
      );
    } else {
      navButtons.push(<button className="menu-exit" onClick={() => socket?.emit("join new lobby")}>
        Join Next Game
      </button>
      );
    }
  } else if (isLeader) {
    navButtons.push(
      <button className="game-start" onClick={startGame}>
        Start Game
      </button>
    );
  }
  return (
    <div className="window" >
      {(!inLobby || gameInfo?.gameStatus == "pregame") && (
        <div className={`lobby-window`}>
          {/* {!connected && <FireBackground />} */}
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
            {connected && <LobbyPlayerList
              yourPID={PID}
              players={players}
              reconnect={reconnect}
              kickPlayer={kickPlayer}
            />}
            <div className="bottom-button">
              <div>
                {navButtons}
              </div>
            </div>
            <div className="num-spectators">
              {lobbyExists && <h3>Spectators: {nSpectators}</h3>}
            </div>
          </div>
        </div>
      )}
      <GameContextProvider yourPid={PID} spectating={isSpectating}>
        <Hitler
        />
        {inLobby && !isMobile && (
          <ChatRoom />
        )}
      </GameContextProvider>
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
  yourPID?: PID,
  players: PlayerMap,
  reconnect: (PID: PID) => void,
  kickPlayer: (PID: PID) => void
}> = ({ yourPID, ...props }) => {
  let you = yourPID && props.players ? props.players[yourPID] : null;
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
            if (yourPID == null) {
              props.reconnect(player.PID);
            }
          }}
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
  return (
    //@ts-expect-error - blah
    <div className="player-list" style={{ ['--president-hat']: `url(${presHat})` }}>
      <div className="connected-players">
        <h3>Connected Players:</h3>
        <ul>{connectedPlayers}</ul>
      </div>
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