import React from "react";
import { Alert } from "./parts/Alert";
import io from "socket.io-client";

/*DD_SERVER and DD_PORT are environmental variables given during compilation.
  They are used if the front-end is being served as static files, 
  and the backend is hosted on some other server. */
let serverURL = process.env.DD_SERVER !== undefined ? process.env.DD_SERVER : "localhost";
let port = process.env.DD_PORT !== undefined ? process.env.DD_PORT : "1945";
let SOCKET_URL = `${serverURL}:${port}`;

export const Error_string = "back to the lab again";

const DEFAULT_CONTEXT = {
    socket: undefined,
    queryStrings: {},
    lobbyID: undefined,
    setLobbyID: undefined,
    socketURL: SOCKET_URL,
    alertMessage: '',
    setAlertMessage: undefined
}

export const setLocalStorage = (key, value) => {
    return window.localStorage.setItem(key, JSON.stringify({ value }));
}

export const getLocalStorage = (key) => {
    return JSON.parse(window.localStorage.getItem(key) || '{}').value;
}
export const setSessionStorage = (key, value) => {
    return window.sessionStorage.setItem(key, JSON.stringify({ value }));
}

export const getSessionStorage = (key) => {
    return JSON.parse(window.sessionStorage.getItem(key) || {}).value;
}
export const LOBBY_MAPPING_KEY = 'lobbyMapping'
export const CURRENT_LOBBY_KEY = 'currentLobby'

const ContextObject = React.createContext(DEFAULT_CONTEXT);

function getQueryStrings() {
    let queryStrings = {};
    //Stack Overflow Function :^)
    var parts = window.location.href.replace(
        /[#&]+([^=&]+)=([^&]*)/gi,
        function (m, key, value) {
            queryStrings[key] = value;
        }
    );
    return queryStrings;
}

function createSocket(lobbyID) {
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

const useGameSocket = (lobbyID) => {
    const [socket, setSocket] = React.useState(undefined);
    React.useEffect(() => {
        setSocket((oldSocket) => {
            oldSocket?.close()
            return createSocket(lobbyID);
        })
    }, [lobbyID, setSocket])
    return socket;
}

export const GameContext = ({ children }) => {
    const [queryStrings, setQueryStrings] = React.useState(getQueryStrings());
    const [lobbyID, setLobbyID] = React.useState(getQueryStrings().lobby || '');
    const [alertMessage, setAlertMessage] = React.useState('');
    const [connected, setConnected] = React.useState(false);
    const disconnector = React.useRef(null)
    const socket = useGameSocket(lobbyID);

    React.useEffect(() => {
        if (!socket) return;

        if (lobbyID) {
            setConnected(false);
            clearTimeout(disconnector.current);
            disconnector.current = setTimeout(
                () => {
                    setAlertMessage("Lobby Doesn't Exist!");
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
            window.onpopstate = undefined;
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

export const useGameContext = () => React.useContext(ContextObject);
