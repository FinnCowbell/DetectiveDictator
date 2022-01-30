import React from "react";
import ReactDOM from "react-dom";
import App from "./App.js";
import "./styles.scss";
/*DD_SERVER and DD_PORT are environmental variables given during compilation.
  They are used if the front-end is being served as static files, 
  and the backend is hosted on some other server. */
let serverURL = process.env.DD_SERVER !== undefined ? process.env.DD_SERVER : "localhost";
let port = process.env.DD_PORT !== undefined ? process.env.DD_PORT : "1945";
let socketURL = `${serverURL}:${port}`;
ReactDOM.render(<App socketURL={socketURL} />, document.getElementById("root"));
