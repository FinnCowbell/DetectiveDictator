import React from "react";
import ReactDOM from "react-dom";
import App from "./App.js";
import "./styles.scss";
/*DD_SERVER and DD_PORT are environmental variables given during compilation.
  They are used if the front-end is being served as static files, 
  and the backend is hosted on some other server. */
const DD_SERVER = process.env.DD_SERVER
const DD_PORT = process.env.DD_PORT
let isHeroku = process.env.PORT != ""
let socketURL = "";
if (!isHeroku) {
  socketURL = `${DD_SERVER}:${DD_PORT}`;
}
ReactDOM.render(<App socketURL={socketURL} />, document.getElementById("root"));
