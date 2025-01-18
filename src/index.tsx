import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./styles.scss";
import { GameContext } from "./LobbyContext";

ReactDOM.render((
  <GameContext>
    <App />
  </GameContext>), document.getElementById("root")
);
