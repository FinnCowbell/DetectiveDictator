import { hot } from "react-hot-loader/root";
import React from "react";

import Lobby from "./Lobby.js";
import MainMenu from "./MainMenu.js";
import { useGameContext } from "./AppContext.js";
import FireBackground from "./rendering/FireBackground";
import WaveBackground from "./rendering/WaveBackground";


/*The main purpose of the App react component is socket room  management.*/
const App = () => {
  const { lobbyID } = useGameContext();
  return (
    <>
      {lobbyID === '' && <MainMenu />}
      <Lobby />
    </>
  )
}

export default hot(App);
