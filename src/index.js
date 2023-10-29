import React from "react";
import ReactDOM from "react-dom";
import App from "./App.js";
import "./styles.scss";
import { GameContext } from "./GameContext.js";

ReactDOM.render((
  <GameContext>
    <App />
  </GameContext>), document.getElementById("root"));
