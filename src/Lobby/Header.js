import React from 'react'
export default function Header(props){
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