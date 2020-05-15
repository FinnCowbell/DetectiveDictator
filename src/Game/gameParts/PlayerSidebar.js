import React from 'react'
export default class PlayerSidebar extends React.Component{
  render(){
    let order = this.props.order;
    let players = this.props.players;
    let event = this.props.eventDetails;
    let pres = event.presidentPID;
    let chan = event.chancellorPID;
    let prevPres = event.previousPresidentPID;
    let prevChan = event.previousChancellorPID;
    let playersAreSelectable = this.props.playersAreSelectable;
    let selectedPlayer = this.props.selectedPlayer;
    let membershipClasses = {"-1": "", 0: "liberal", 1: "fascist", 2: "hitler"};
    let sidebarItems = order.map((PID, index)=>{
      let player = players[PID];
      if(!player){
        return null;
      }
      let status =  (!player.alive ? "dead" : 
                    (player.PID == pres ? "president" : 
                    (player.PID == chan ? "chancellor" : "")));
      let vote = event.votes && event.votes[PID] //Outputs event.votes[PID] if both exist. null/undefined otherwise.
      let selectable = (playersAreSelectable)
      let selected = (player.PID == selectedPlayer);
      return (
      <div key={index} className={"player " + (membershipClasses[player.membership] || "")}>
        {/* Inserts the Voting results DIV if there is a vote. */}
        <div className={'vote ' + (vote == 1 ? 'ja' : (vote == 0 ? 'nein' : 'hidden'))}>
          {vote}
        </div>
        <div className={"player-content " + (selected ? "selected" : (selectable ? "selectable" : ""))} 
              onClick={()=>this.props.changeSelectedPlayer(PID)}>
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
}