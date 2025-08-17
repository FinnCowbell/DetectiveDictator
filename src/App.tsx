import React from "react";

import Lobby from "./Lobby";
import MainMenu from "./MainMenu";
import { SocketContext } from "./SocketContext";

/*The main purpose of the App react component is socket room  management.*/
const App = () => {
  return (
    <SocketContext>
      <MainMenu />
      <Lobby />
    </SocketContext>
  )
}

export default App