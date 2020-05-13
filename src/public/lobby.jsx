import {Header, StatusBar, LoadingMessage, PlayerList} from './modules/MenuParts.js';
import {ChatRoom} from './modules/ChatRoom.js'
import {Hitler as Game} from './Hitler.js';
class Lobby extends React.Component{
  constructor(props){
    super(props);
    this.socket = this.props.io(`/${this.props.lobbyID}`);
    this.state = {
      PID: document.cookie,
      lobbyExists: false,
      inLobby: false,
      you: null,
      players: null,
      name: null,
      gameInfo: null,
    }
    this.leaveLobby = this.leaveLobby.bind(this);
    this.kickPlayer = this.kickPlayer.bind(this);
    this.connect = this.connect.bind(this);
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
      this.setState({
        you: arg.you,
        inLobby: true,
        players: arg.lobbyInfo.players,
      })
    });
    socket.on('kick', ()=>this.leaveLobby('Kick'));
    socket.on('lobby update info', (arg)=>{
      this.setState({
        players: arg.lobbyInfo.players,
      })
    });
    socket.on('game starting', (arg)=>{
      this.setState({
        gameInfo: arg.gameInfo,
      })
      socket.emit('activate game signals');
    });
    socket.emit('user init request');
  }
  leaveLobby(reason){
    window.location.replace("/");
  }
  connect(username){
    this.socket.emit("join lobby", {
      username: username,
      PID: this.state.PID,
    });
  }
  reconnect(PID){
    let arg = {
      oldPID: PID,
      PID: this.state.PID
    }
    this.socket.emit("rejoin lobby", arg);
  }
  kickPlayer(PID){
    const you = this.state.you;
    console.log("Gonna kick em. gonna do it.")
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
    if(!lobbyID){this.leaveLobby();}
    //If we're just connecting, display the correct connection field.
    connectionForm = (gameInfo && gameInfo.isRunning) ? <ReconnectPlayerForm players={this.state.players} reconnect={this.reconnect}/> : <NewPlayerForm connect={this.connect}/>;
    return(
      <div>

        {(!inLobby || !gameInfo.isRunning) && (<div className="Lobby">
          <Header lobbyID ={lobbyID}/>
          {!lobbyExists && <LoadingMessage leaveLobby={this.leaveLobby}/>}
          {(lobbyExists && !inLobby) && connectionForm}
          <PlayerList PID={this.state.PID} 
                      you={this.state.you} 
                      players={this.state.players}
                      kickPlayer={this.kickPlayer}
                      />
          {(this.state.you && this.state.you.isLeader) &&(
            <button className="game-start" 
                    onClick={this.startGame}>
              Start Game
            </button>)}
        </div>)}
        {inLobby && (<ChatRoom socket={this.socket} you={this.state.you}/>)}
        <div>
          <Game you={this.you} socket={this.socket}/>
        </div>
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
  console.log(props.players);
  let disconnectedPlayers = props.players.map((player)=>(
    !player.connected ? (
      <button onClick={()=>{props.reconnect(player.PID)}}>
        {player.username}
      </button>) : null
  ))
  return(
    <div className="rejoin-form">
      { disconnectedPlayers.length &&
        <h2>Game in Progress!</h2>}
        {disconnectedPlayers}
      <button onClick={props.spectate}>Spectate</button>
    </div>
  )
}

// pathname is /lobby/words/, so words are in index 2.
// If we're in root or 
const lobbyID = window.location.pathname.split("/")[2]; 
ReactDOM.render(
  <Lobby io={io} lobbyID={lobbyID}/>,
  document.getElementById('root')
)