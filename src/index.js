import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.js';
import "./styles.scss";
//DD_SERVER and DD_PORT are environmental variables given during compilation.
let socketURL = "";
if(process.env.DD_SERVER){
  socketURL = `${process.env.DD_SERVER}:${process.env.DD_PORT}`;
}
// pathname is now ./#lobby=KyleKyle, and can be obtained with the fuction below.
ReactDOM.render(<App socketURL={socketURL}/>, document.getElementById('root'));