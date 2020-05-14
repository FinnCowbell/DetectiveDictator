import React from 'react';
import ReactDOM from 'react-dom';

import App from './App.js';

import "./styles.scss";

let SOCKETIO_PORT = 1945;
let SOCKETIO_SERVER = 'http://localhost';

// pathname is now ./?lobby=KyleKyle
let socketURL = SOCKETIO_SERVER + ":" + SOCKETIO_PORT;

let urlVars = getUrlVars();
let lobbyID = urlVars.lobby;


ReactDOM.render(<App lobbyID={lobbyID} socketURL={socketURL}/>, document.getElementById('root'));

//Stack Overflow Functions :^)
function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
      vars[key] = value;
  });
  return vars;
}