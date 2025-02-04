import React, { useCallback, useEffect, useMemo, useState } from "react";

import demoGameState from "./model/DemoGameState";
import { GameEventInfo, Round, UIInfo, UIInfoEvent } from "./model/GameState";
import { PID, Player } from "./model/Player";
import { PlayerAction } from "./model/GameEvent";
import { useSocketContext } from "./SocketContext";
import { usePlayerAction } from "./hooks/usePlayerAction";
import { filterPrivateInfo } from "./helpers/filterPrivateInfo";

interface IGameContextProviderProps {
  yourPid?: PID;
  spectating?: boolean;
}

export interface ICurrentGameContext extends Round, GameEventInfo {
  rounds: Round[];
  playerAction: PlayerAction;
  uiInfo: UIInfo;
  sendUIInfo: (arg: UIInfoEvent) => void;
  togglePrivateInfo: (bool: boolean) => void;
  spectating: boolean;
}

const DEMO_GAME_CONTEXT: ICurrentGameContext = {
  ...demoGameState,
  ...demoGameState.rounds[0],
  ...demoGameState.rounds[0].states[0],
  playerAction: "pre game",
  spectating: false,
  sendUIInfo: () => { },
  togglePrivateInfo: () => { },
}

const EMPTY_UI_INFO: UIInfo = {
  selectedPlayer: undefined,
  voteReceived: false,
  voted: {},
  disconnected: {},
};

const GameContext = React.createContext<ICurrentGameContext>(DEMO_GAME_CONTEXT)

export const GameContextProvider: React.FC<IGameContextProviderProps> = ({ children, yourPid, spectating }) => {
  const { socket, lobbyID } = useSocketContext();
  const [rounds, setRounds] = useState<Round[] | undefined>();
  const [uiInfo, setUIInfo] = useState<UIInfo>(EMPTY_UI_INFO);
  const [privateInfo, setPrivateInfo] = useState(false);

  const clearUIInfo = useCallback(() => {
    setUIInfo(EMPTY_UI_INFO);
  }, []);

  React.useEffect(() => {
    setRounds(undefined);
    clearUIInfo();
  }, [lobbyID]);

  const recieveUIInfo = useCallback((arg: UIInfoEvent) => {
    switch (arg.name) {
      case "player voted":
        setUIInfo((prev) => ({ ...(prev), voted: { ...prev.voted, [arg.PID]: true } }));
        break;
      case "select player":
        setUIInfo((prev) => ({ ...prev, selectedPlayer: arg.PID }));
        break;
      case "disconnect":
        setUIInfo((prev) => ({ ...prev, disconnected: { ...prev.disconnected, [arg.PID]: true } }));
        break;
      case "reconnect":
        setUIInfo((prev) => ({ ...prev, disconnected: { ...prev.disconnected, [arg.PID]: false } }));
        break;
      default:
        break;
    }
  }, []);



  const sendUIInfo = useCallback((arg: UIInfoEvent) => {
    //arg contains arg.name and other required arg info.
    //All shared UI events pass are sent to other players.
    //The info is broadcast to all other players, but updates instantly on the player's side.
    socket.emit("send ui info", arg);
    recieveUIInfo(arg);
  }, [socket, recieveUIInfo])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gameSignals: { [key: string]: (...args: any[]) => void } = {
      "full game info": (arg: { round: Round }) => {
        setRounds(() => [arg.round]);
        arg.round.uiEvents?.forEach(recieveUIInfo);
      },
      "new round": ({ round }: { round: Round }) => {
        clearUIInfo();
        setRounds((prev) => [...(prev || []), round]);
      },
      "new state": ({ state }: { state: GameEventInfo }) => {
        clearUIInfo();
        setRounds((prev) => {
          const currentRound = prev?.length ? prev[prev.length - 1] : undefined;
          if (!prev || !currentRound) return prev;
          return [
            ...prev.slice(0, prev.length - 1),
            {
              ...currentRound,
              states: currentRound?.states.concat([state])
            }
          ]
        })
      },
      "end game": ({ endState }: {
        endState: Round;
      }) => {
        setRounds((rounds) => (rounds || []).concat([endState]));
      },
      "ui event": (arg: UIInfoEvent) => {
        recieveUIInfo(arg);
      },
    }
    if (socket) {
      Object.entries(gameSignals).forEach(([signal, handler]) => {
        socket.on(signal, handler);
      });
      return () => {
        Object.entries(gameSignals).forEach(([signal, handler]) => {
          socket.off(signal, handler);
        });
      }
    }
  }, [socket, clearUIInfo, recieveUIInfo]);

  const privateRounds = useMemo(() => { if (privateInfo || !rounds) return rounds; else return filterPrivateInfo(rounds, yourPid); }, [privateInfo, rounds, yourPid]);

  const currentRound: Round | undefined = useMemo(() => privateRounds?.[privateRounds.length - 1], [privateRounds]);

  const playerAction: PlayerAction = usePlayerAction({ round: privateRounds?.[privateRounds.length - 1], yourPid });

  const currentState = React.useMemo(() => {
    return {
      ...currentRound?.states?.[currentRound.states.length - 1],
    }
  }, [currentRound]);

  const you: Player | undefined = currentState.you ?? currentRound?.players[yourPid!];

  return (
    <GameContext.Provider value={{
      ...DEMO_GAME_CONTEXT,
      ...(rounds ? { rounds } : {}),
      ...(currentRound ? { ...currentRound } : {}),
      ...(currentState ? { ...currentState } : {}),
      ...(you ? { you } : {}),
      ...(uiInfo ? { uiInfo } : {}),
      sendUIInfo,
      playerAction,
      togglePrivateInfo: setPrivateInfo,
      spectating: spectating || false,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGameDetails = () => {
  return React.useContext(GameContext);
}