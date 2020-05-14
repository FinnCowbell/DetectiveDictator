import { hot } from "react-hot-loader/root";
import React from 'react';

import Lobby from './Lobby.js';
import MainMenu from './MainMenu.js';

class App extends React.Component{
  constructor(props){
    super(props)
    this.state={
      lobbyID: this.props.lobbyID || null
    }
    this.setLobbyID = this.setLobbyID.bind(this);
  }
  setLobbyID(newID){
    this.setState({lobbyID: newID});
  }
  render(){
    if(this.state.lobbyID){
      return (<Lobby socketURL={this.props.socketURL} lobbyID={this.state.lobbyID} setLobbyID={this.setLobbyID}/>)
    } else{
      return (<MainMenu socketURL={this.props.socketURL} setLobbyID={this.setLobbyID}/>)
    }
  }
}

export default hot(App);