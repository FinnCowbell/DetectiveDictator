import React from 'react';
import ReactDOM from 'react-dom';

import App from './App.js';

import "./styles.scss";

//DD_SERVER and DD_PORT are environmental variables given during compilation.
let socketURL = "";
if(process.env.DD_SERVER){
  socketURL += process.env.DD_SERVER;
  if(process.env.DD_PORT){
    socketURL += `:${process.env.DD_PORT}`;
  }
}

let urlVars = getUrlVars();
let lobbyID = urlVars.lobby;
// pathname is now ./?lobby=KyleKyle

ReactDOM.render(<App lobbyID={lobbyID} socketURL={socketURL}/>, document.getElementById('root'));

//Stack Overflow Functions :^)
function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
      vars[key] = value;
  });
  return vars;
}