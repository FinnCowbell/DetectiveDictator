import React from "react";
import { Alert } from "./parts/Alert";
import io, { Socket } from "socket.io-client";

/*DD_SERVER and DD_PORT are environmental variables given during compilation.
  They are used if the front-end is being served as static files, 
  and the backend is hosted on some other server. */
let serverURL = process.env.DD_SERVER !== undefined ? process.env.DD_SERVER : "localhost";
let port = process.env.DD_PORT !== undefined ? process.env.DD_PORT : "1945";
let SOCKET_URL = `${serverURL}:${port}`;

export interface ILobbyContext {
  socket: Socket | undefined;
  connected: boolean;
  queryStrings: { [key: string]: string };
  lobbyID: string | undefined;
  setLobbyID: (lobbyID: string) => void;
  socketURL: string;
  alertMessage: string;
  setAlertMessage: (message: string) => void;
}

const DEFAULT_CONTEXT: ILobbyContext = {
  socket: undefined,
  connected: false,
  queryStrings: {},
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

const clearLobbyMapping = (lobbyID: string) => {
  const localStorageValue = getLocalStorage(LOBBY_MAPPING_KEY);
  delete localStorageValue[lobbyID];
  setLocalStorage(LOBBY_MAPPING_KEY, localStorageValue)
}

const ContextObject = React.createContext(DEFAULT_CONTEXT);

function getQueryStrings(): any {
  let queryStrings: { [key: string]: string } = {};
  //Stack Overflow Function :^)
  var parts = window.location.href.replace(
    /[#&]+([^=&]+)=([^&]*)/gi,
    (m, key, value) => (queryStrings[key] = value)
  );
  return queryStrings;
}

function createSocket(lobbyID?: string): Socket {
  const isGame = !!lobbyID;
  const path = isGame ? `/${lobbyID.toLowerCase()}` : '/menu';
  return io(SOCKET_URL + path, {
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: lobbyID ? 2000 : 5000,
    reconnectionAttempts: lobbyID ? Infinity : 10,
    forceNew: true,
  });
}

const useGameSocket = (lobbyID?: string) => {
  const [socket, setSocket] = React.useState<Socket | undefined>();
  React.useEffect(() => {
    setSocket((oldSocket?: Socket) => {
      oldSocket?.close()
      return createSocket(lobbyID);
    })
  }, [lobbyID, setSocket])
  return socket;
}

export const GameContext: React.FC = ({ children }) => {
  const [queryStrings, setQueryStrings] = React.useState(getQueryStrings());
  const [lobbyID, setLobbyID] = React.useState<string>(getQueryStrings().lobby || '');
  const [alertMessage, setAlertMessage] = React.useState('');
  const [connected, setConnected] = React.useState(false);
  const disconnector = React.useRef<NodeJS.Timeout>()
  const socket = useGameSocket(lobbyID);

  React.useEffect(() => {
    if (!socket) return;

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

    socket.on("alert", (alert) => {
      setAlertMessage(alert);
    });

    socket.on("connect", () => {
      clearTimeout(disconnector.current);
      setConnected(true);
    });
    socket.on("connect_error", (err) => {
      console.error("Connection error:", err);
    });

    socket.on("lobby created", (arg) => {
      setLobbyID(arg.ID);
    });
  }, [socket]);

  React.useEffect(() => {
    setLobbyID(queryStrings.lobby || '');
  }, [queryStrings]);

  React.useEffect(() => {
    if (lobbyID) {
      window.location.href = "#lobby=" + lobbyID;
    } else {
      window.location.href = "#";
    }
  }, [lobbyID]);

  React.useEffect(() => {
    setQueryStrings(getQueryStrings());
    window.onpopstate = () => setQueryStrings(getQueryStrings());
    return () => {
      window.onpopstate = null;
    }
  }, [])

  return (
    <ContextObject.Provider value={{
      ...DEFAULT_CONTEXT,
      queryStrings,
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

export const useLobbyContext = () => React.useContext(ContextObject);
