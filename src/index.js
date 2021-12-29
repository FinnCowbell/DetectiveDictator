import React from "react";
import ReactDOM from "react-dom";
import App from "./App.js";
import "./styles.scss";
/*DD_SERVER and DD_PORT are environmental variables given during compilation.
  They are used if the front-end is being served as static files, 
  and the backend is hosted on some other server. */
let socketURL = "";
ReactDOM.render(<App socketURL={socketURL} />, document.getElementById("root"));
