import { hot } from "react-hot-loader/root";
import React from "react";
import io from "socket.io-client";

import Alert from "./parts/Alert.js";
import Lobby from "./Lobby.js";
import MainMenu from "./MainMenu.js";
import { useGameContext } from "./AppContext.js";

/*The main purpose of the App react component is socket room  management.*/
const App = () => {
  const { lobbyID, connected, socket, setLobbyID, setAlertMessage } = useGameContext();
  return (
    <>
      {lobbyID === '' && (
        <MainMenu
          connected={connected}
          socket={socket}
          setLobbyID={setLobbyID}
        />
      )
      }
      <Lobby
        socket={socket}
        lobbyID={lobbyID}
        setAlert={setAlertMessage}
        setLobbyID={setLobbyID}
      />
    </>
  )
}

export default hot(App);
