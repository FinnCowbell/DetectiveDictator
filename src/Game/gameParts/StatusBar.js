import React from 'react'
export default function StatusBar(props){
  let president, presidentName, presidentPID;
  let chancellor, chancellorName, chancellorPID; 
  let investigatee, investigateePID, investigateeName;
  let victim, victimPID, victimName;
  let description = ""; 
  let event = props.event;
  let action = props.action;
  let players = props.players;
  let yourPID = props.yourPID;
  let you = players[yourPID] || null;
  let details = event.details;
  presidentPID = details.presidentPID;
  chancellorPID = details.chancellorPID;
  investigateePID = details.investigatee;
  victimPID = details.victim;
  if(presidentPID){
    president = players[presidentPID];
    presidentName= president.username;
  }
  if(chancellorPID){
    chancellor = players[chancellorPID];
    chancellorName = chancellor.username;
  }
  if(investigateePID){
    investigatee = players[investigateePID];
    investigateeName = investigatee.username;
  }
  if(victimPID){
    victim = players[details.victim];
    victimName = victim.username;
  }
  switch(action){
    case 'pre game':
      description = `Please wait, the game will begin shortly`
      break;
    case 'new round':
      description = `A new round has begun.`
      break;
    case 'chancellor pick':
      description = `${presidentName} is picking a chancellor`
      break;
    case 'your chancellor pick':
      description = `Pick Your Chancellor.`;
      break;
    case 'chancellor vote':
      description = `Vote for President ${presidentName} and Chancellor ${chancellorName}.`;
      break;
    case 'chancellor not voted':
      description = `The vote didn't pass.`
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
      description = `Chancellor ${chancellorName} is discarding a policy.`;
      break;
    case 'liberal policy placed':
      description = `A Liberal policy has been placed.`
      break;
    case 'fascist policy placed':
      description = `A Fascist policy has been placed.`
      break;
    case 'president peek':
      description = `President ${presidentName} is viewing the top 3 policy cards.`
      break;
    case 'your president peek':
      description = `Take a peek. (Rightmost = Topmost Card)`
      break;
    case 'president investigate':
      description = `President ${presidentName} is picking someone to investigate.`
      break;
    case 'your president investigate':
      description = `Pick someone to investigate.`
      break;
    case 'president investigated':
      description = `${presidentName} investigated ${investigateeName}.`
      break;
    case 'your president investigated':
      description = `${presidentName} investigated ${investigateeName}.`
      break;
    case 'president pick':
      description = `President ${presidentName} is selecting the next president.`
      break;
    case 'your president pick':
      description = `Pick the next president.`
      break;
      case 'president kill':
        description = `President ${presidentName} is picking someone to assassinate.`
        break;
    case 'your president kill':
      description = `Pick someone to kill.`
      break;
    case 'player killed':
      description = `${victimName} has been murdered.`
      break;
    case 'liberal win hitler':
      description = `Hitler has been killed.`
      break;
    case 'fascist win hitler':
      description = `Hitler has been elected.`
      break;
    case 'fascist win cards':
      description = `The Fascists have taken control.`
      break;
    case 'liberal win cards':
      description = `The Liberals have taken control.`
      break;
    default:
      description = "Unimplemented event name!"
      break;
  }
  let gameStatus;
  return(
    <div className="status-bar">
      <div className="status-div">
        {event &&(
        <h2 className="status">
          {description.toUpperCase()}
        </h2>)
        }
      </div>
      {/* <div className="you-are">
        <h4>{you && `You are: ${you.username}`}</h4>
      </div>
      <div className="lobby-id">
        <h4 className="lobby-id"> Lobby ID: {props.lobbyID}</h4>
      </div> */}
    </div>
  );
}