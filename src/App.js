import { hot } from "react-hot-loader/root";
import React from 'react';
import io from 'socket.io-client'

import Alert from './parts/Alert.js';
import Lobby from './Lobby.js';
import MainMenu from './MainMenu.js';

/*The main purpose of the App react component is socket room  management.*/
class App extends React.Component{
  constructor(props){
    super(props)
    this.state={
      urlVars: {},
      lobbyID: this.props.lobbyID || null,
      alertMessage: "",
      alertMessageState: 0,
      rerenderLobby: true,
    }
    this.setLobbyID = this.setLobbyID.bind(this);
    this.setAlert = this.setAlert.bind(this);
  }
  componentDidMount(){

    this.updateURLVars();
    window.onpopstate = ()=>this.updateURLVars();
  }

  updateURLVars(){
    let URLVars = getURLVars();
    if(URLVars.lobby && URLVars.lobby != this.state.lobbyID){
      this.setLobbyID(URLVars.lobby);
    }
  }

  setLobbyID(newID){
    this.setState({
      lobbyID: newID || null,
    });
    if(newID){
      window.location.href = '#lobby=' + newID
      this.setState({rerender: true})
    } else{
      window.location.href = "/#"
    }
  }
 

  setAlert(message){
    if(typeof message == 'string' && message != null){
      this.setState(prevState=>({
        alertMessageState: prevState.alertMessageState + 1,
        alertMessage: message,
      }));
    }
  }
  
  render(){
    if(this.state.rerender){
      this.setState({rerender:false});
      return(<div></div>);
    }
    let content = this.state.lobbyID ? 
      <Lobby socketURL={this.props.socketURL} lobbyID={this.state.lobbyID} setAlert={this.setAlert} setLobbyID={this.setLobbyID}/> : 
      <MainMenu socketURL={this.props.socketURL} setLobbyID={this.setLobbyID}/>;
    return(
      <div>
        <Alert toggledState={this.state.alertMessageState}>{this.state.alertMessage}</Alert>
        {content}
      </div>
    )
  }
}
//Stack Overflow Functions :^)
function getURLVars() {
  let urlVars = {}
  var parts = window.location.href.replace(/[#&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
      urlVars[key] = value;
  });
  return urlVars;
}

export default hot(App);
