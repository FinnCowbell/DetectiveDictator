import {Header, StatusBar, LoadingMessage} from './modules/parts.js';

class Lobby extends React.Component{
  constructor(props){
    super(props);
    this.socket = this.props.io(`/${this.props.lobbyID}`);
    this.state = {
      PID: document.cookie,
      connected: false,
      players: null,
      name: null,
      gameInfo: null,
    }
    this.leaveLobby = this.leaveLobby.bind(this);
  }
  componentDidMount(){
    const socket = this.socket
    socket.on('lobby found',(lobbyInfo)=>{
      this.setState({
        players: lobbyInfo.players,
        gameInfo: lobbyInfo.gameInfo,
        connected: true,
      })
    });
    this.setState({
      socket:socket,
    })
  }
  leaveLobby(reason){
    window.location.replace("/");
  }
  connect(username){
    const socket = this.socket
    socket.emit("join lobby", {
      username: username, 
      PID: this.state.PID,
    });
  }
  render(){
    const lobbyID = this.props.lobbyID;
    const gameInfo = this.state.gameInfo;
    let connectionField;
    if(!lobbyID){
      this.leaveLobby();
    }
    if(!this.state.connected){
      return(
        <div className="loading-alert">
          <LoadingMessage lobbyID={lobbyID}/>
          <button onClick={this.leaveLobby}>Return to Menu</button>
        </div>
      )
    }else{
      if(gameInfo && !gameInfo.running){
        connectionField = <NewPlayerForm connect={(username)=>this.connect(username)}/>;
      } else if(gameInfo && gameInfo.running){
        connectionField = <ReconnectPlayerForm />
      }
    }
    return(
      <div>
        <Header lobbyID ={lobbyID}/>
        {connectionField}
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
      <div class="new-player-form">
        <form>
          <label for="username">Enter your Name:</label>
          <input id="username" type="text" onChange={()=>{this.handleChange()}}></input>
        </form>
        <button onClick={()=>{this.handleSubmit()}}>Join</button>
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