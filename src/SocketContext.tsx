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


function createSocket(lobbyID?: string): Socket {
  const isGame = !!lobbyID;
  const path = isGame ? `/${lobbyID.toLowerCase()}` : '/menu';
  return io(SOCKET_URL + path, {
    reconnection: true,
    reconnectionDelay: 250,
    reconnectionDelayMax: lobbyID ? 2000 : 5000,
    reconnectionAttempts: lobbyID ? Infinity : 10,
  });
}

const baseSocket = window.GAME_SOCKET! ||= createSocket();

function getQueryStrings() {
  let queryStrings: { [key: string]: string } = {};
  window.location.href.replace(
    /[#&]+([^=&]+)=([^&]*)/gi,
    (m, key, value) => (queryStrings[key] = value)
  );
  return queryStrings;
}

function useQueryStrings(): { [key: string]: string } {
  return (React.useMemo(() => getQueryStrings(), [window.location.href]));
}

const ContextObject = React.createContext({
  ...DEFAULT_CONTEXT,
  socket: baseSocket
});

const useGameSocket = (lobbyID?: string) => {
  const [socket, setSocket] = React.useState<Socket>(baseSocket);
  React.useEffect(() => {
    const newSocket: Socket = createSocket(lobbyID);
    setSocket(newSocket);
    window.GAME_SOCKET = newSocket;
    return () => { newSocket.close() };
  }, [lobbyID, setSocket])
  return socket;
}

export const SocketContext: React.FC = ({ children }) => {
  const [lobbyID, _setLobbyID] = React.useState<string>(getQueryStrings()[LOBBY_QSP] || '');
  const [alertMessage, setAlertMessage] = React.useState('');
  const [connected, setConnected] = React.useState(false);
  const disconnector = React.useRef<NodeJS.Timeout>()
  const socket = useGameSocket(lobbyID);


  const setLobbyID = React.useCallback((newId: string) => {
    _setLobbyID(newId);
    if (newId) {
      history.replaceState(null, '', "#lobby=" + newId);
    } else {
      history.replaceState(null, '', "#");
    }
  }, [_setLobbyID]);

  React.useEffect(() => {
    const lobbyQSP = getQueryStrings()[LOBBY_QSP] || '';
    if (lobbyQSP !== lobbyID) {
      setLobbyID(lobbyQSP);
    }
  }, [lobbyID]);

  React.useEffect(() => {
    // If we navigate, the lobby ID will change.
    // Clearing should update it from the QSP, if present.
    const handlePopState = () => {
      setLobbyID(getQueryStrings()[LOBBY_QSP] || '');
    }
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [])

  React.useEffect(() => {
    if (lobbyID) {
      setConnected(false);
      clearTimeout(disconnector.current);
      disconnector.current = setTimeout(
        () => {
          setAlertMessage("Lobby Doesn't Exist!");
          clearLobbyMapping(lobbyID)
          setLobbyID('')
        },
        5000
      );
    }

    const messages: { [event: string]: (...arg: any[]) => void } = {
      "alert": (alert: string) => {
        setAlertMessage(alert);
      },
      "connect": () => {
        clearTimeout(disconnector.current);
        setConnected(true);
      },
      "connect_error": (err: Error) => {
        console.error("Connection error:", err);
      },
      "lobby created": (arg: { ID: string }) => {
        setLobbyID(arg.ID);
      }
    };

    Object.keys(messages).forEach(event => {
      socket.on(event, messages[event]);
    });

    return () => {
      Object.keys(messages).forEach(event => {
        socket.off(event, messages[event]);
      });
    }
  }, [socket]);

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
