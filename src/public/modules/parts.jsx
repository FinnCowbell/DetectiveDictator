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
      <h3 className="loading-status">Connecting to {props.lobbyID}...</h3>
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

export {Header, LoadingMessage, StatusBar};