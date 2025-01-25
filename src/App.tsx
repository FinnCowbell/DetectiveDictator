import { hot } from "react-hot-loader/root";
import React from "react";

import Lobby from "./Lobby";
import MainMenu from "./MainMenu";
import { useSocketContext } from "./SocketContext";

/*The main purpose of the App react component is socket room  management.*/
const App = () => {
  const { lobbyID } = useSocketContext();
  return (
    <>
      {lobbyID === '' && <MainMenu />}
      <Lobby />
    </>
  )
}

export default hot(App);
