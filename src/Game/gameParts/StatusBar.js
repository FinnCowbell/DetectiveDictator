import React from 'react'
export default function StatusBar(props){
  let president, chancellor, presidentName, presidentPID, chancellorName, chancellorPID, description = "";
  let event = props.event;
  let action = props.action;
  let players = props.players;
  let yourPID = props.yourPID;
  let you = players[yourPID] || null;
  let details = event.details;
  presidentPID = details.presidentPID;
  chancellorPID = details.chancellorPID;
  if(presidentPID){
    president = players[presidentPID];
    presidentName= president.username;
  }
  if(chancellorPID){
    chancellor = players[chancellorPID];
    chancellorName = chancellor.username;
  }
  console.log(action);
  switch(action){
    case 'pre game':
      description = `Please wait, the game will begin shortly`
      break;
    case 'new round':
      description = `a new round has begun.`
      break;
    case 'chancellor pick':
      description = `${presidentName} is picking a chancellor`
      break;
    case 'your chancellor pick':
      description = `Pick Your Chancellor.`;
      break;
    case 'chancellor vote':
      description = `Vote for ${presidentName} as President and ${chancellorName} as Chancellor.`;
      break;
    case 'your president discard':
      description = `Discard a Policy.`;
      break;
    case 'president discard':
      description = `The vote passed and President ${presidentName} is discarding a policy.`
      break;
    case 'your chancellor discard':
      description = `Discard a Policy.`;
      break;
    case 'chancellor discard':
      description = `Chancellor ${presidentName} is discarding a policy.`;
      break;
    default:
      description = "Unimplemented event name!"
      break;
  }
  let gameStatus;
  return(
    <div className="status-bar">
      <div className="lobby-id">
        <h4 className="lobby-id"> Lobby ID: {props.lobbyID}</h4>
      </div>
      <div className="status-div">
        {event &&(
        <h2 className="status">
          {description.toUpperCase()}
        </h2>)
        }
      </div>
      <div className="you-are">
        <h4>{you && `You are: ${you.username}`}</h4>
      </div>
    </div>
  );
}