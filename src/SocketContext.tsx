import React from "react";
import { Alert } from "./parts/Alert";
import io, { Socket } from "socket.io-client";

declare global {
  interface Window {
    GAME_SOCKET?: Socket;
  }
}

/*DD_SERVER and DD_PORT are environmental variables given during compilation.
  They are used if the front-end is being served as static files, 
  and the backend is hosted on some other server. */
let serverURL = process.env.DD_SERVER !== undefined ? process.env.DD_SERVER : "localhost";
let port = process.env.DD_PORT !== undefined ? process.env.DD_PORT : "1945";
let SOCKET_URL = `${serverURL}:${port}`;
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

export const setLocalStorage = (key: string, value: any) => {
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
  lobbyID?: string,
  eventHandlers?: { [event: string]: (...arg: any[]) => void }
): Socket {
  const isGame = !!lobbyID;
  const path = isGame ? `/${lobbyID.toLowerCase()}` : '/menu';
  const socket = io(SOCKET_URL + path, {
    reconnection: true,
    reconnectionDelay: 250,
    reconnectionDelayMax: lobbyID ? 2000 : 5000,
    reconnectionAttempts: lobbyID ? Infinity : 10,
  });
  if (eventHandlers) {
    Object.keys(eventHandlers).forEach(event => {
      socket.on(event, eventHandlers[event]);
    });
    // If socket is already connected, manually call the connect handler
    if (socket.connected && eventHandlers["connect"]) {
      eventHandlers["connect"]();
    }
  }
  return socket;
}

function getQueryStrings() {
  let queryStrings: { [key: string]: string } = {};
  window.location.href.replace(
    /[?&]+([^=&]+)=([^&]*)/gi,
    (m, key, value) => (queryStrings[key] = value)
  );
  return queryStrings;
}

function getLobbyQSP(): string | undefined {
  return getQueryStrings()[LOBBY_QSP] || undefined;
}


const baseSocket = window.GAME_SOCKET! ||= createSocket(getLobbyQSP());

const ContextObject = React.createContext({
  ...DEFAULT_CONTEXT,
  socket: baseSocket
});

const useGameSocket = (
  lobbyID?: string,
  eventHandlers?: { [event: string]: (...arg: any[]) => void }
) => {
  const socketRef = React.useRef<Socket>(baseSocket);
  const [socket, setSocket] = React.useState<Socket>(baseSocket);

  React.useEffect(() => {
    // Disconnect previous socket if exists
    if (socketRef.current && socketRef.current !== baseSocket) {
      socketRef.current.close();
    }
    const newSocket: Socket = createSocket(lobbyID, eventHandlers);
    socketRef.current = newSocket;
    setSocket(newSocket);
    window.GAME_SOCKET = newSocket;
    return () => {
      newSocket.close();
    };
  }, [lobbyID, eventHandlers]);

  return socket;
}

export const SocketContext = ({ children }: React.PropsWithChildren<{}>) => {
  const [lobbyID, _setLobbyID] = React.useState<string>(getLobbyQSP() || '');
  const [alertMessage, setAlertMessage] = React.useState('');
  const [connected, setConnected] = React.useState(false);
  const [timeoutId, setTimeoutId] = React.useState<NodeJS.Timeout | null>(null);

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
      "alert": (alert: string) => {
        setAlertMessage(alert);
      },
      "connect": () => {
        setConnected(true);
      },
      "connect_error": (err: Error) => {
        setAlertMessage("Connection error: " + err.message);
      },
      "disconnect": () => {
        console.log("Socket disconnected");
      },
      "lobby created": (arg: { ID: string }) => {
        setLobbyID(arg.ID);
      }
    };
  }, []);

  React.useEffect(() => {
    if (connected || !lobbyID) {
      setTimeoutId((prev) => {
        if (prev) {
          clearTimeout(prev);
        }
        return null;
      });
    } else {
      setTimeoutId(() => setTimeout(() => {
        setAlertMessage("Lobby Doesn't Exist!");
        clearLobbyMapping(lobbyID);
        setLobbyID("");
      }, 5000));
    }
  }, [lobbyID, connected]);

  const socket = useGameSocket(lobbyID, eventHandlers);

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
