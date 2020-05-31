import { hot } from "react-hot-loader/root";
import React from 'react';
import io from 'socket.io-client'

import Alert from './Alert.js';
import Lobby from './Lobby.js';
import MainMenu from './MainMenu.js';

/*The main purpose of the App react component is socket room  management.*/
class App extends React.Component{
  constructor(props){
    super(props)
    let socket;
    if(this.props.lobbyID){
      socket = io.connect(this.props.socketURL + `/${this.props.lobbyID.toLowerCase()}`);
    } else{
      socket = io.connect(this.props.socketURL + `/menu`);
    }
    this.state={
      lobbyID: this.props.lobbyID || null,
      socket: socket,
    }
    this.setLobbyID = this.setLobbyID.bind(this);
    this.setAlert = this.setAlert.bind(this);
  }

  setLobbyID(newID){
    this.state.socket.close();
    this.setState({
      lobbyID: newID || null,
      socket: io.connect(this.props.socketURL + (newID ? `/${newID.toLowerCase()}` : "/menu"))
    });
  }

  setAlert(message){
    if(typeof message == 'string'){
      this.setState({
      message: message,
      })
    }
  }
  
  render(){
    let content = this.state.lobbyID ? 
      <Lobby socket={this.state.socket} lobbyID={this.state.lobbyID} setAlert={this.setAlert} setLobbyID={this.setLobbyID}/> : 
      <MainMenu socket={this.state.socket} setLobbyID={this.setLobbyID}/>;
    return(
      <div>
        <Alert message={this.state.message}/>
        {content}
      </div>
    )
  }
}

export default hot(App);