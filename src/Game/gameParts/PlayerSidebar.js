import React from 'react'
import bullet from '../media/Bullet.png';
import ja from '../media/ja.png';
import nein from '../media/nein.png';
import hat from '../media/president-hat.png';

export default function PlayerSidebar(props){
    let order = props.order;
    let yourPID = props.yourPID;
    let players = props.players;
    let memberships = props.memberships;
    let eventDetails = props.event.details;
    let votes = eventDetails.votes || {};
    let pres = eventDetails.presidentPID;
    let chan = eventDetails.chancellorPID;
    let prevPres = eventDetails.previousPresidentPID;
    let prevChan = eventDetails.previousChancellorPID;
    let playersAreSelectable = props.playersAreSelectable;
    //if action == your president kill
    let bulletIndex = props.uiInfo.bulletIndex;
    console.log("playersAreSelectable: " + playersAreSelectable);
    //Maps each membership to a className.
    const membershipClasses = {"-1": "", 0: "liberal", 1: "fascist", 2: "hitler"};
    const voteClasses = {false: "nein", true: "ja"};
    const showVoteEvents = new Set(['president discard', 'chancellor discard', 'liberal policy placed', 'fascist policy placed', 'chancellor not voted'])
    let sidebarItems = order.map((PID, index)=>{
      let player = players[PID];
      if(!player){
        console.log(`No player with PID ${PID}`);
        return null;
      }
      const statusClass =  (!player.alive ? "dead" : (PID == pres ? "president" : (PID == chan ? "chancellor" : "")));
      const voteClass = voteClasses[votes[PID]] || "hidden";//Outputs event.votes[PID] if both exist. null/undefined otherwise.
      const isYou = (PID == yourPID) ? "you " : ""; 
      const membership = membershipClasses[memberships[player.PID]] || "hidden";
      const selectable = (playersAreSelectable)
      const isSelected = (PID == props.selectedPlayer);
      const isKillingPlayer = (props.event.name == "president kill");
      const showVotes = showVoteEvents.has(props.event.name);
      const hasBullet = (props.uiInfo.bulletIndex == index)|| (isSelected && yourPID == pres);
      return (
      <div key={index} className={`player ${membership} ${isYou}`}>
        {/* Next to the player content, we show a bullet OR the vote status, but not both. */}
        {isKillingPlayer && (
          <div className="bullet-holder">
            {hasBullet &&
              <img className="bullet" src={bullet}/>
            }
          </div>
         )}
        {showVotes && (
          <div className={'vote ' + voteClass}>
            {voteClass == "ja" ? (<img src={ja}/>) : (<img src={nein}/>)
            }
          </div>
        )}

        <div className={"player-bar " + (isSelected ? "selected " : (selectable ? "selectable " : ""))} 
              onClick={()=>{
                if(selectable){
                  props.changeSelectedPlayer(PID)
                }
                if(isKillingPlayer){
                  props.moveBullet(index)
                }
              }}>
          {statusClass == "president" && <img className="hat" src={hat}/>}
          <div className={'status ' + statusClass}>
            {statusClass}
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