import {hot} from 'react-hot-loader/root'
import React from 'react';
import ReactDOM from 'react-dom';
import Lobby from '../Lobby';
import "../styles.scss";
// pathname is /lobby/words/, so words are in index 2.
const lobbyID = window.location.pathname.split("/")[2]; 

let PORT = 1945;
let connectionURL = window.location.href.split(':')
connectionURL[2] = PORT;
connectionURL = connectionURL.join(':')

ReactDOM.render(<Lobby connectionURL={connectionURL} lobbyID={lobbyID}/>, document.getElementById('root'));