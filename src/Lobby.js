import React from 'react';
import io from 'socket.io-client'

import Header from './Lobby/Header.js'
import ChatRoom from './Lobby/ChatRoom.js'
import {default as Game} from './Game/Hitler.js';

export default class Lobby extends React.Component{
  constructor(props){
    super(props);
    this.socket = io.connect(this.props.socketURL + "/" + this.props.lobbyID);
    this.state = {
      PID: document.cookie,
      username: null,
      lobbyExists: false,
      inLobby: false,
      players: null,
      name: null,
      gameInfo: null,
    }
    this.leaveLobby = this.leaveLobby.bind(this);
    this.kickPlayer = this.kickPlayer.bind(this);
    this.connect = this.connect.bind(this);
    this.changePID = this.changePID.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.startGame = this.startGame.bind(this);
  }
  componentDidMount(){
    const socket = this.socket;
    socket.on('lobby init info',(lobbyInfo)=>{
      this.setState({
        players: lobbyInfo.players,
        gameInfo: lobbyInfo.gameInfo,
        lobbyExists: true,
      })
    });
    socket.on("lobby joined", (arg)=>{
      let newPID = arg.newPID ||this.state.PID
      this.setState({
        inLobby: true,
        PID: newPID,
        players: arg.lobbyInfo.players,
      })
    });
    socket.on('kick', ()=>this.leaveLobby("You've been Kicked From the Lobby!"));
    socket.on('end game', ()=>this.leaveLobby("The game has ended."));
    socket.on('lobby update info', (arg)=>{
      this.setState({
        players: arg.lobbyInfo.players,
      })
    });
    socket.on('lobby game starting', (arg)=>{
      this.setState({
        gameInfo: arg.gameInfo,
      })
      socket.emit('activate game signals');
    });
    socket.emit('user init request');
  }
  changePID(newPID){
    this.setState({
      "PID": newPID,
    })
  }
  leaveLobby(reason){
    this.props.setLobbyID(null);
  }
  connect(username){
    this.socket.emit("join lobby", {
      username: username,
      PID: this.state.PID,
    });
    this.setState({
      'username': username,
    })
  }
  reconnect(PID){
    let arg = {
      oldPID: PID,
      PID: this.state.PID
    }
    this.socket.emit("rejoin game", arg);
  }
  kickPlayer(PID){
    const you = this.state.players[this.state.PID];
    if(you.isLeader){
      this.socket.emit('request kick', {
        kickee: PID,
      });
    }
  }
  startGame(){
    this.socket.emit('game init');
  }
  render(){
    let connectionForm;
    const lobbyID = this.props.lobbyID;
    const lobbyExists = this.state.lobbyExists;
    const inLobby = this.state.inLobby;
    const gameInfo = this.state.gameInfo;
    const players = this.state.players;
    const you = this.state.players && this.state.players[this.state.PID];
    const isLeader = you && you.isLeader;
    if(!lobbyID){this.leaveLobby();}
    //If we're just connecting, display the correct connection field.
    connectionForm = (gameInfo && gameInfo.isRunning) ? <ReconnectPlayerForm players={this.state.players} reconnect={this.reconnect}/> : <NewPlayerForm connect={this.connect}/>;
    return(
      <div className="window">
        {(!inLobby || !gameInfo.isRunning) && (<div className="lobby-window">
          <Header lobbyID ={lobbyID}/>
          {!lobbyExists && <LoadingMessage leaveLobby={this.leaveLobby}/>}
          {(lobbyExists && !inLobby) && connectionForm}
          <LobbyPlayerList PID={this.state.PID} 
                      players={this.state.players}
                      kickPlayer={this.kickPlayer}
                      />
          {(isLeader) &&(
            <button className="game-start" 
                    onClick={this.startGame}>
              Start Game
            </button>)}
        </div>)}
        {inLobby && (<ChatRoom socket={this.socket} username={this.state.username}/>)}
        <Game lobbyID={lobbyID} yourPID={this.state.PID} socket={this.socket}/>
      </div>
    )
  }
}

class NewPlayerForm extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      username: ""
    }
    this.handleEnter = this.handleEnter.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleEnter(e){
    if(e.keyCode == 13){
      this.handleSubmit(e);
    }
  }
  handleChange(e){
    this.setState({username:event.target.value});
  }
  handleSubmit(e){
    let username = this.state.username;
    if(username != ""){
      this.props.connect(username);
    }
  }
  render(){
    return(
      <div className="new-player-form">
        <label>Enter your Name:</label>
        <input className="username-input" type="text" onKeyDown={this.handleEnter} onChange={this.handleChange}></input>
        <button onClick={this.handleSubmit}>Join</button>
      </div>
    )
  }
}

function ReconnectPlayerForm(props){
  if(!props.players){return null}
  let disconnectedPlayers = props.players.map((player)=>(
    !player.connected ? (
      <button onClick={()=>{props.reconnect(player.PID)}}>
        {player.username}
      </button>) : null
  ))
  return(
    <div className="rejoin-form">
      <h2>Game in Progress!</h2>
      {disconnectedPlayers.length && disconnectedPlayers}
      )
      <button className="spectate-button" onClick={props.spectate}>Spectate</button>
    </div>
  )
}

function LoadingMessage(props){
  return(
    <div className="loading-message">
      <h3 className="loading-status">Connecting... (Lobby might not exist!)</h3>
      <button onClick={props.leaveLobby}>Return to Menu</button>
    </div>
  )
}

function LobbyPlayerList(props){
  let yourPID = props.PID;
  let you = props.players && props.players[yourPID];
  let listItems = null;
  if(props.players){
    listItems = props.players.map((player)=>(
      <li key={player.username} 
          className={(player.isLeader ? "leader " : "" )+
                     (!player.connected ? "disconnected " : "")+
                     ((player.PID == yourPID) ? "you " : "")}>
        {player.username}
        {(you && you.isLeader && player.PID != yourPID) &&
          <button className="kick-button" onClick={()=>props.kickPlayer(player.PID)}>
            Kick
          </button>
        }
      </li>
    ))
  }
  return(
    <div className="player-list">
      <h3>Connected Players:</h3>
      <ul>
        {listItems}
      </ul>
    </div>
  )
}

// If we're in root or 
// ReactDOM.render(
//   <Lobby lobbyID={lobbyID}/>,
//   document.getElementById('root')
// )