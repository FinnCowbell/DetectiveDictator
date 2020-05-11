import {Header, StatusBar, LoadingMessage, PlayerList} from './modules/parts.js';
import {ChatRoom} from './modules/ChatRoom.js'
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
  render(){
    let connectionField;
    const lobbyID = this.props.lobbyID;
    const lobbyExists = this.state.lobbyExists;
    const inLobby = this.state.inLobby;
    const gameInfo = this.state.gameInfo;
    if(!lobbyID){this.leaveLobby();}
    //If we're just connecting, display the correct connection field.
    if(gameInfo){
      connectionField = gameInfo.running ? <ReconnectPlayerForm/> : <NewPlayerForm connect={(username)=>this.connect(username)}/>;
    }
    return(
      <div>
        <Header lobbyID ={lobbyID}/>
        {!lobbyExists && 
          <LoadingMessage leaveLobby={this.leaveLobby}/>}
        {(lobbyExists && !inLobby) && 
          connectionField}
        <PlayerList PID={this.state.PID} 
                    you={this.state.you} 
                    players={this.state.players}
                    kickPlayer={this.kickPlayer}
                    />
        {inLobby &&(
        <ChatRoom socket={this.socket}
                  you={this.state.you}></ChatRoom>
        )}
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

// pathname is /lobby/words/, so words are in index 2.
// If we're in root or 
const lobbyID = window.location.pathname.split("/")[2]; 
ReactDOM.render(
  <Lobby io={io} lobbyID={lobbyID}/>,
  document.getElementById('root')
)