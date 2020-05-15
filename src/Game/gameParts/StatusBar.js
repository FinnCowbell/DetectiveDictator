import React from 'react'
export default function StatusBar(props){
  let name, details, president, chancellor, presidentName, chancellorName;
  let description = "";
  let event = props.event;
  let players = props.players;
  if(event.name && event.details){
    name = event.name;
    details = event.details;
    switch(event.name){
      case 'pre game':
        description = `Please wait, the game will begin shortly`
        break;
      case 'new round':
        description = `A new round has begun!`
        break;
      case 'chancellor pick':
        president = players[details.presidentPID] || null;
        presidentName = (president && president.username) || null;
        description = `${presidentName} is picking a chancellor`
        break;
      case 'chancellor vote':
        president = players[details.presidentPID] || null;
        chancellor = players[details.chancellorPID] || null;
        presidentName = (president && president.username) || null;
        chancellorName = (chancellor && chancellor.username) || null;
        description = `Vote for ${presidentName} as President and ${chancellorName} as Chancellor`;
        break;
      default: 
        description = "Unimplemented event name!"
        break;
    }
  }
  let gameStatus;
  return(
    <div className="status-bar">
      <div className="lobby-info">
        <h4 className="lobby-id"> Lobby ID: {props.lobbyID}</h4>
      </div>
      {event &&(
      <h2 className="status">
        {description}
      </h2>)
      }
    </div>
  );
}