import React, { Suspense } from 'react';

import Header from './Lobby/Header.js'
import ChatRoom from './Lobby/ChatRoom.js'
//Lazy Load the game in the background, as it is not neccessary for loading the lobby.
const Game = React.lazy(() => import('./Game/Hitler.js'));
// import {default as Game} from './Game/Hitler.js';

export default class Lobby extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      PID: null,
      username: null,
      lobbyExists: false,
      inLobby: false,
      players: {},
      username: null,
      gameInfo: null,
    }
    this.disconnector = null;
    this.RECONNECT_TIME = 5000;
    this.leaveLobby = this.leaveLobby.bind(this);
    this.kickPlayer = this.kickPlayer.bind(this);
    this.connect = this.connect.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.startGame = this.startGame.bind(this);
    this.spectateGame = this.spectateGame.bind(this);
  }
  componentDidMount(){
    let socket = this.props.socket;
    socket.on('lobby init info',(arg)=>{
      this.setState({
        lobbyExists: true,
        players: arg.initInfo.players,
        gameInfo: arg.initInfo.gameInfo,
      })
    });
    socket.on("lobby joined", (arg)=>{
      this.setState({
        inLobby: true,
        PID: arg.PID,
      })
    });
    socket.on('kick', ()=>this.leaveLobby("You've been kicked From the lobby!"));
    socket.on('end game', ()=>this.leaveLobby("The game has ended."));
    socket.on('lobby update info', (arg)=>{
      this.setState({
        players: arg.lobbyInfo.players,
        gameInfo: arg.lobbyInfo.gameInfo,
      })
    });
    socket.on('disconnect', ()=>{
      this.disconnector = setTimeout(()=>this.leaveLobby(`Lost Connection to ${this.props.lobbyID}`),this.RECONNECT_TIME)
    })
    socket.on('reconnect', ()=>{
      clearTimeout(this.disconnector)
    })
    socket.on('alert', (alert)=>{
      this.props.setAlert(alert);
    });
    //establishing lobby connection needs to occur AFTer signals have been triggered.
    socket.emit('connection init request');
  }
  componentWillUnmount(){
    this.props.socket.close();
  }
  leaveLobby(reason = null){
    if(reason){
      this.props.setAlert(reason);
    }
    this.props.setLobbyID(null);
  }
  connect(username){
    this.props.socket.emit("join lobby", {
      username: username,
    });
    this.setState({
      'username': username,
    })
  }
  reconnect(PID){
    let arg = {
      PID: PID,
    }
    this.props.socket.emit("rejoin lobby", arg);
  }
  kickPlayer(PID){
    const you = this.state.players[this.state.PID];
    if(you.isLeader){
      this.props.socket.emit('request kick', {
        kickee: PID,
      });
    }
  }
  startGame(){
    this.props.socket.emit('game init');
  }
  spectateGame(){
    this.props.socket.emit('spectator init');
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
    //If the game is running, only reconnects are allowed.
    connectionForm = (gameInfo && gameInfo.isRunning) ? 
    <ReconnectPlayerForm players={this.state.players} reconnect={this.reconnect}/> : 
    <NewPlayerForm connect={this.connect}/>; 
    return(
      <div className="window">
        {(!inLobby || !gameInfo.isRunning) && (
        <div className="lobby-window">
          <div className="content">
            <Header lobbyID ={lobbyID}/>
            {!lobbyExists && <LoadingMessage leaveLobby={()=>{this.leaveLobby(null)}}/>}
            {(lobbyExists && !inLobby) && connectionForm}
            <LobbyPlayerList PID={this.state.PID} 
                        players={this.state.players}
                        kickPlayer={this.kickPlayer}
                        />
            <div className="bottom-button">
              {(isLeader) &&(
                <button 
                  className="game-start" 
                  onClick={this.startGame}>
                  Start Game
                </button>)}
              {(gameInfo && gameInfo.isRunning) &&(
                <button 
                  className="spectate"
                  onClick={this.spectateGame}>
                  Spectate
                </button>
              )}
            </div>
          </div>
        </div>)}
        {inLobby && (<ChatRoom socket={this.props.socket} username={this.state.username}/>)}
        <Suspense fallback={<div className="game-window"></div>}>
          <Game lobbyID={lobbyID} yourPID={this.state.PID} leaveLobby={this.leaveLobby} socket={this.props.socket}/>
        </Suspense>
        
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
    this.MAX_LENGTH = 30;//30 is generous >:(
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
    let msg = e.target.value;
    if(msg.length > this.MAX_LENGTH){
      msg = msg.split('').splice(0,this.MAX_LENGTH).join('');
    }
    this.setState({username:msg});
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
        <input className="username-input" type="text" value={this.state.username} onKeyDown={this.handleEnter} onChange={this.handleChange}></input>
        <button onClick={this.handleSubmit}>Join</button>
      </div>
    )
  }
}

function ReconnectPlayerForm(props){
  if(!props.players){return null}
  let iterablePlayers = Object.values(props.players);
  let disconnectedPlayers = iterablePlayers.map((player)=>(
    !player.connected ? (
      <button key={player.username} onClick={()=>{props.reconnect(player.PID)}}>
        {player.username}
      </button>) : null
  ))
  return(
    <div className="rejoin-form">
      <h2>Game in Progress!</h2>
      {disconnectedPlayers.length && disconnectedPlayers}
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
  let iterablePlayers = Object.values(props.players);
  let listItems = null;
  if(props.players){
    listItems = iterablePlayers.map((player)=>(
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