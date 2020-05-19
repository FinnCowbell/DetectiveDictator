import { hot } from "react-hot-loader/root";
import React from 'react';
import io from 'socket.io-client'

import Lobby from './Lobby.js';
import MainMenu from './MainMenu.js';

class App extends React.Component{
  constructor(props){
    super(props)
    this.state={
      lobbyID: this.props.lobbyID || null,
      socket: this.props.lobbyID ? 
      io.connect(this.props.socketURL + `/${this.props.lobbyID}`) : 
      io.connect(this.props.socketURL + "/menu"),
    }
    this.setLobbyID = this.setLobbyID.bind(this);
  }
  setLobbyID(newID){
    this.state.socket.close();
    this.setState({
      lobbyID: newID || null,
      socket: io.connect(this.props.socketURL + (newID ? `/${newID}` : "/menu"))
    });
  }
  render(){
    let socket = this.state.socket;
    if(this.state.lobbyID){
      return (<Lobby socket={socket} lobbyID={this.state.lobbyID} setLobbyID={this.setLobbyID}/>)
    } else{
      return (<MainMenu socket={socket} setLobbyID={this.setLobbyID}/>)
    }
  }
}

export default hot(App);