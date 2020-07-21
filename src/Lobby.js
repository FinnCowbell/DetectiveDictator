import React, { Suspense } from 'react';

import Header from './parts/Header.js'
import ChatRoom from './parts/ChatRoom.js'
import SingleInputForm from './parts/SingleInputForm'
//Lazy Load the game in the background, as it is not neccessary for loading the lobby.
const Game = React.lazy(() => import('./Hitler.js'));
// import {default as Game} from './Hitler.js';

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
      nSpectators: 0,
      isSpectating: false,
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
    socket.on("change lobby", (arg)=>{
      this.leaveLobby();
      this.props.setLobbyID(arg.ID);
    })
    socket.on('kick', ()=>this.leaveLobby("You've been kicked From the lobby!"));
    // socket.on('end game', ()=>{
    //   setTimeout(()=>{
    //     this.leaveLobby("The game has ended.")
    //   },100000)
    // });
    socket.on('lobby update info', (arg)=>{
      this.setState({
        players: arg.lobbyInfo.players,
        gameInfo: arg.lobbyInfo.gameInfo,
        nSpectators: arg.lobbyInfo.nSpectators
      })
    });
    socket.on('disconnect', ()=>{
      this.disconnector = setTimeout(()=>this.leaveLobby(`Lost Connection to ${this.props.lobbyID}`),this.RECONNECT_TIME)
    })
    socket.on('reconnect', ()=>{
      clearTimeout(this.disconnector);
    })
    socket.on('alert', (alert)=>{
      this.props.setAlert(alert);
    });
    //establishing lobby connection needs to occur AFTer signals have been triggered.
    socket.emit('connection init request');
  }
  componentWillUnmount(){
    this.props.socket.close();
    clearTimeout(this.disconnector);
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
    this.setState({
      'isSpectating': true,
    })
  }
  render(){
    let bottomButton;
    const lobbyID = this.props.lobbyID;
    const lobbyExists = this.state.lobbyExists;
    const inLobby = this.state.inLobby;
    const gameInfo = this.state.gameInfo;
    const players = this.state.players;
    const you = players && players[this.state.PID];
    const isLeader = you && you.isLeader;
    const spectating = this.state.isSpectating;
    if(!inLobby){
      if(lobbyExists){
        bottomButton = (
          <div>
            <button className="menu-exit" onClick={this.leaveLobby}>Return to Menu</button>
            <button className="spectate"onClick={this.spectateGame}>Spectate!</button>
          </div>
        )
      } else{
        bottomButton = <button className="menu-exit" onClick={this.leaveLobby}>Return to Menu</button>
      }
    } else if(isLeader){
      bottomButton = <button className="game-start" onClick={this.startGame}>Start Game</button>
    } else if(gameInfo && gameInfo.isRunning){
      bottomButton = <button className="spectate"onClick={this.spectateGame}>Spectate!</button>
    }
    return(
      <div className="window">
        {(!inLobby || !gameInfo.isRunning) && (
        <div className={`lobby-window`}>
          <div className="content">
            <Header lobbyID ={lobbyID}/>
            <LobbyStatus
              connect={this.connect}
              gameInfo={gameInfo}
              lobbyExists={lobbyExists}
              inLobby={inLobby}
              />
            <LobbyPlayerList 
              PID={this.state.PID} 
              players={players}
              reconnect={this.reconnect}
              kickPlayer={this.kickPlayer}
              />
            <div className="bottom-button">
              {bottomButton}
            </div>
            <div className="num-spectators">
              <h3>Spectators: {this.state.nSpectators}</h3>
            </div>
          </div>
        </div>)}
        <Suspense fallback={<div className="game-window"></div>}>
          {/* Lazy Loading Game Files */}
          <Game lobbyID={lobbyID} spectating={spectating} yourPID={this.state.PID} leaveLobby={this.leaveLobby} socket={this.props.socket}/>
        </Suspense>
        {inLobby && (<ChatRoom socket={this.props.socket} username={this.state.username} spectating={spectating}/>)}
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
    this.MAX_LENGTH = 30;//30 is generous CHRIS >:(
    this.join = this.join.bind(this);
  }
  join(username){
    if(username != ""){
      this.props.connect(username);
    }
  }
  render(){
    return(
      <div className="new-player-form">
        <SingleInputForm className="username-input" button="Join"
         MAX_LENGTH={this.MAX_LENGTH} submit={this.join}>
        <label>Enter your Name:</label>
        </SingleInputForm>
      </div>
    )
  }
}

function LobbyStatus(props){
  let status;
  if(!props.lobbyExists){
    status = (<h2>Loading Lobby...</h2>)
  } else if(props.gameInfo && props.gameInfo.isRunning){
    status = (<h2>Game in Progress!</h2>)
  } else if(props.inLobby){
    status = null;
  } else{
    status = <NewPlayerForm connect={props.connect}></NewPlayerForm>
  } 
  return(
    <div className="lobby-status">
      {status}
    </div>
  )
}

function ReconnectPlayerForm(props){
  if(!props.players){return null}
  let iterablePlayers = Object.values(props.players);
  let disconnectedPlayers = iterablePlayers.map((player)=>(
    !player.connected ? (
      <div key={player.username} onClick={()=>{props.reconnect(player.PID)}}>
        {player.username}
      </div>) : null
  ))
  return(
    <div className="rejoin-form">
      <h2>Game in Progress!</h2>
      {disconnectedPlayers.length && disconnectedPlayers}
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
  let connectedPlayers, disconnectedPlayers = [null, null];
  let nDisconnectedPlayers = 0;
  if(props.players){
    //Counting the disconnected Players
    iterablePlayers.forEach((player)=>{if(!player.connected){nDisconnectedPlayers++;}});
    
    //Creating the list of connected Players
    connectedPlayers = iterablePlayers.map((player)=>( player.connected && 
      <li key={player.username} 
          className={(player.isLeader ? "leader " : "" )+
                     ((player.PID == yourPID) ? "you " : "")}>
        {player.username}
        {(you && you.isLeader && player.PID != yourPID) &&
          <button className="kick-button" onClick={()=>props.kickPlayer(player.PID)}>
            Kick
          </button>
        }
      </li>
    ))
    
    //Creating the list of Disconnected Players
    disconnectedPlayers = iterablePlayers.map((player)=>(!player.connected && 
      <li key={player.username} 
          className="disconnected"
          onClick={()=>{props.reconnect(player.PID)}}>
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
      {true ? (
        <div className="connected-players">
          <h3>Connected Players:</h3>
          <ul>
            {connectedPlayers}
          </ul>
        </div>
      ) : null}
      {true ? (
        <div className="disconnected-players">
          <hr/>
          {(nDisconnectedPlayers ? <h3>Disconnected Players:</h3> : null
          )}
          <ul>
            {disconnectedPlayers}
          </ul>
        </div>
      ) : null}
    </div>
  )
}