import React from 'react'
export default function PlayerSidebar(props){
    let order = props.order;
    let event = props.event;
    let yourPID = props.yourPID;
    let players = props.players;
    let memberships = props.memberships;
    let eventDetails = event.details;
    let pres = eventDetails.presidentPID;
    let chan = eventDetails.chancellorPID;
    let prevPres = eventDetails.previousPresidentPID;
    let prevChan = eventDetails.previousChancellorPID;
    let playersAreSelectable = props.playersAreSelectable;
    console.log("playersAreSelectable: " + playersAreSelectable);
    let selectedPlayer = props.selectedPlayer;
    let membershipClasses = {"-1": "", 0: "liberal", 1: "fascist", 2: "hitler"};
    let sidebarItems = order.map((PID, index)=>{
      let player = players[PID];
      if(!player){
        return null;
      }
      let status =  (!player.alive ? "dead" : 
                    (PID == pres ? "president" : 
                    (PID == chan ? "chancellor" : "")));
      let isYou = (PID == yourPID) ? "you " : ""; 
      let membership = membershipClasses[memberships[player.PID]] || "";
      let vote = eventDetails.votes && eventDetails.votes[PID] //Outputs event.votes[PID] if both exist. null/undefined otherwise.
      let selectable = (playersAreSelectable)
      let selected = (PID == selectedPlayer);
      return (
      <div key={index} className={`player ${membership} ${isYou}`}>
        {/* Inserts the Voting results DIV if there is a vote. */}
        <div className={'vote ' + (vote == 1 ? 'ja' : (vote == 0 ? 'nein' : 'hidden'))}>
          {vote}
        </div>
        <div className={"player-content " + (selected ? "selected " : (selectable ? "selectable " : ""))} 
              onClick={()=>{if(selectable){props.changeSelectedPlayer(PID)}}}>
          <div className={'status ' + status}>
            {status}
          </div>
          <h3 className="username">{player.username}</h3>
        </div>
      </div>
      )
    });
    return (
      <div className="player-sidebar">
        <div className="players">
          {sidebarItems}
        </div>
      </div>
    )
  }