import React from 'react';
import io from 'socket.io-client'
import Header from './Lobby/Header.js'

export default class MainMenu extends React.Component{
  constructor(props){
    super(props);

    this.socket = io.connect(this.props.socketURL + "/menu");
    this.joinLobby = this.joinLobby.bind(this);
    this.createLobby = this.createLobby.bind(this);
  }
  componentDidMount(){
    const socket = this.socket;
    socket.on("lobby created", (arg)=>{
      this.joinLobby(arg.ID);
    })
  }
  createLobby(){
    const socket = this.socket;
    socket.emit("create lobby");
  }
  joinLobby(lobbyID){
    this.props.setLobbyID(lobbyID);
  }
  render(){
    return(
      <div>
        <Header lobbyID={null}/>
        <div className="main-menu">
          <button className="new-lobby" onClick={this.createLobby}>
            <h4>Create Game</h4>
          </button>
          <LobbyInput joinLobby={this.joinLobby}/>
        </div>
      </div>
    )
  }
}

class LobbyInput extends React.Component{
  constructor(props){
    super(props)
    this.state={
      lobbyName: ""
    }
  }
  handleSubmit(e){
    if(e.keyCode == 13 && this.state.lobbyName != ""){
      this.props.joinLobby(this.state.lobbyName);
    }
  }
  handleChange(e){
    this.setState({lobbyName: e.target.value})
  }
  render(){
    return(
      <div className="existing-lobby">
        <h4>Join an Existing Lobby</h4>
        <input className="lobby-input" value={this.state.lobbyName} onKeyDown={(e)=>this.handleSubmit(e)} onChange={(e)=>this.handleChange(e)}/>
        <button onClick={()=>this.props.joinLobby(this.state.lobbyName)}>Join</button>
      </div>
    )
  }
}