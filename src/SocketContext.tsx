import React from "react";
import { Alert } from "./parts/Alert";
import io, { Socket } from "socket.io-client";

declare global {
  interface Window {
    GAME_SOCKET: Socket;
  }
}

/*DD_SERVER and DD_PORT are environmental variables given during compilation.
  They are used if the front-end is being served as static files, 
  and the backend is hosted on some other server. */
const serverURL = process.env.DD_SERVER !== undefined ? process.env.DD_SERVER : "localhost";
const port = process.env.DD_PORT !== undefined ? process.env.DD_PORT : "1945";
const SOCKET_URL = `${serverURL}:${port}`;
const LOBBY_QSP = "lobby";

export interface ISocketContext {
  socket: Socket;
  connected: boolean;
  lobbyID: string | undefined;
  setLobbyID: (lobbyID: string) => void;
  socketURL: string;
  alertMessage: string;
  setAlertMessage: (message: string) => void;
}

const DEFAULT_CONTEXT: Omit<ISocketContext, 'socket'> = {
  connected: false,
  lobbyID: undefined,
  setLobbyID: () => { },
  socketURL: SOCKET_URL,
  alertMessage: '',
  setAlertMessage: () => { }
}

export const setLocalStorage = (key: string, value: object) => {
  return window.localStorage.setItem(key, JSON.stringify({ value }));
}

export const getLocalStorage = (key: string) => {
  return JSON.parse(window.localStorage.getItem(key) || '{}').value;
}

export const LOBBY_MAPPING_KEY = 'lobbyMapping'

export const clearLobbyMapping = (lobbyID: string) => {
  const localStorageValue = getLocalStorage(LOBBY_MAPPING_KEY);
  delete localStorageValue[lobbyID];
  setLocalStorage(LOBBY_MAPPING_KEY, localStorageValue)
}


function createSocket(
  lobbyID?: string
): Socket {
  window.GAME_SOCKET?.close();
  const isGame = !!lobbyID;
  const path = isGame ? `/${lobbyID.toLowerCase()}` : '/menu';
  return window.GAME_SOCKET = io(SOCKET_URL + path, {
    reconnection: true,
    reconnectionDelay: 250,
    reconnectionDelayMax: lobbyID ? 2000 : 5000,
    reconnectionAttempts: lobbyID ? Infinity : 10,
  });
}

function getQueryStrings() {
  const queryStrings: { [key: string]: string } = {};
  window.location.href.replace(
    /[?&]+([^=&]+)=([^&]*)/gi,
    (m, key, value) => (queryStrings[key] = value)
  );
  return queryStrings;
}

function getLobbyQSP(): string | undefined {
  return getQueryStrings()[LOBBY_QSP] || undefined;
}


const ContextObject = React.createContext({
  ...DEFAULT_CONTEXT,
  socket: window.GAME_SOCKET
});

const useGameSocket = (
  lobbyID?: string,
  eventHandlers?: { [event: string]: (...arg: any[]) => void }
) => {
  const socket = React.useMemo(() => {
    return createSocket(lobbyID);
  }, [lobbyID]);

  React.useEffect(() => {
    if (eventHandlers) {
      Object.keys(eventHandlers).forEach(event => {
        socket.on(event, eventHandlers[event]);
      });
    }
    socket.connect();
    return () => {
      if (eventHandlers) {
        Object.keys(eventHandlers).forEach(event => {
          socket.off(event, eventHandlers[event]);
        });
      }
    };
  }, [lobbyID, eventHandlers]);

  return socket;
}

export const SocketContext = ({ children }: React.PropsWithChildren<object>) => {
  const [lobbyID, _setLobbyID] = React.useState<string>(getLobbyQSP() || '');
  const [alertMessage, setAlertMessage] = React.useState('');
  const [connected, setConnected] = React.useState(false);
  const timeoutIdRef: React.MutableRefObject<NodeJS.Timeout | null> = React.useRef(null);

  const setLobbyID = React.useCallback((newId: string) => {
    _setLobbyID(newId);
    if (newId) {
      history.replaceState(null, '', "?lobby=" + newId);
    } else {
      history.replaceState(null, '', "?");
    }
  }, [_setLobbyID]);

  React.useEffect(() => {
    const lobbyQSP = getLobbyQSP() || '';
    if (lobbyQSP !== lobbyID) {
      setLobbyID(lobbyQSP);
    }
  }, [lobbyID]);

  React.useEffect(() => {
    // If we navigate, the lobby ID will change.
    // Clearing should update it from the QSP, if present.
    const handlePopState = () => {
      setLobbyID(getLobbyQSP() || '');
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [])

  // Handlers for socket events
  const eventHandlers = React.useMemo(() => {
    return {
      "connect": () => {
        setConnected(true);
      },
      "disconnect": () => {
        setConnected(false);
      },
      "alert": (alert: string) => {
        setAlertMessage(alert);
      },
      "connect_error": (err: Error) => {
        setAlertMessage("Connection error: " + err.message);
      },
      "lobby created": (arg: { ID: string }) => {
        setLobbyID(arg.ID);
      }
    };
  }, []);

  const socket = useGameSocket(lobbyID, eventHandlers);

  React.useEffect(() => {
    if (connected || !lobbyID) {
      clearTimeout(timeoutIdRef.current || -1);
    } else {
      clearTimeout(timeoutIdRef.current || -1);
      timeoutIdRef.current = setTimeout(() => {
        setAlertMessage("Lobby Doesn't Exist!");
        clearLobbyMapping(lobbyID);
        setLobbyID("");
      }, 5000);
    }
    return () => clearTimeout(timeoutIdRef.current || -1);
  }, [lobbyID, connected]);


  return (
    <ContextObject.Provider value={{
      ...DEFAULT_CONTEXT,
      lobbyID,
      setLobbyID,
      setAlertMessage,
      alertMessage,
      socket,
      connected
    }}>
      <Alert />
      {children}
    </ContextObject.Provider>
  )
}

export const useSocketContext = () => React.useContext(ContextObject);
