import {hot} from 'react-hot-loader/root'
import React from 'react';
import ReactDOM from 'react-dom';
import MainMenu from '../MainMenu';
import "../styles.scss"; 

let PORT = 1945;
let connectionURL = window.location.href.split(':')
connectionURL[2] = PORT;
connectionURL = connectionURL.join(':')
console.log(connectionURL);

ReactDOM.render(<MainMenu connectionURL={connectionURL}/>, document.getElementById('root'));