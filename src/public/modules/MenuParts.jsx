function Header(props){
  return(
    <div className="site-header">
      <div className="site-title">
        <h1>Detective Dictator!</h1>
      </div>
      {props.lobbyID &&       
        <div className="lobby-title">
          <h3>Lobby: {props.lobbyID}</h3>
        </div>
      }
    </div>
  )
}

function LoadingMessage(props){
  return(
    <div className="loading-message">
      <h3 className="loading-status">Connecting...</h3>
      <button onClick={props.leaveLobby}>Return to Menu</button>
    </div>
  )
}

function StatusBar(props){
  return(
    <div className="status-bar">
      <h2>{props.status}</h2>
    </div>
  )
} 

function PlayerList(props){
  let yourPID = props.PID;
  let you = props.you;
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

export {Header, LoadingMessage, StatusBar, PlayerList};