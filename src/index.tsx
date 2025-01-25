import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./styles.scss";
import { SocketContext } from "./SocketContext";

ReactDOM.render((
  <SocketContext>
    <App />
  </SocketContext>), document.getElementById("root")
);
