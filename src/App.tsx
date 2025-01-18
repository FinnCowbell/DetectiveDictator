import { hot } from "react-hot-loader/root";
import React from "react";

import Lobby from "./Lobby";
import MainMenu from "./MainMenu";
import { useLobbyContext } from "./LobbyContext";

/*The main purpose of the App react component is socket room  management.*/
const App = () => {
  const { lobbyID } = useLobbyContext();
  return (
    <>
      {lobbyID === '' && <MainMenu />}
      <Lobby />
    </>
  )
}

export default hot(App);
