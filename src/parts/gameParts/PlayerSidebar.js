import React from 'react'

import bullet from '../../media/sidebar/bullet.png';
import ja from '../../media/hands/ja.png';
import nein from '../../media/hands/nein.png';
import sent from '../../media/hands/fist.png';
import presHat from '../../media/sidebar/president-hat.png';
import chanHat from '../../media/sidebar/chancellor-hat.png';
import bulletHole from '../../media/sidebar/bullet-holes.png'

export default class PlayerSidebar extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      closed: false,
    }
    this.toggleState = this.toggleState.bind(this);
    this.changeSelectedPlayer = this.changeSelectedPlayer.bind(this);
  }
  toggleState(){
    const status = !this.state.closed;
    this.setState({
      closed: status
    })
  }
  getMembership(player){
    const membershipClasses = {"-1": "", 0: "liberal", 1: "fascist", 2: "hitler"};
    return membershipClasses[this.props.memberships[player.PID]] || "";
  }
  changeSelectedPlayer(PID){
    this.props.sendUIInfo({
      name: "select player",
      PID: PID
    })
  }
  getStatus(player){
    let details = this.props.fullEvent.details;
    if(player.alive && player.PID == details.presidentPID){
      return "president";
    } else if(player.alive && player.PID == details.chancellorPID){
      return "chancellor";
    } else if(!player.alive){
      return "dead";
    } else{
      return "";
    }
  }
  getVoteClass(player){
    //Gets the vote class
    //Ja, Nein, or Sent.
    //Sent = event is 'chancellor vote' and vote is true.
    const showVoteEvents = new Set(['president discard', 'chancellor discard', 'liberal policy placed', 'fascist policy placed', 'chancellor not voted'])
    let event = this.props.fullEvent;
    let votes = event.details.votes || {};
    let vote = votes[player.PID];
    let voted = this.props.uiInfo.voted || {};
    if(event.name == 'chancellor vote' && voted[player.PID]){
      return "sent";
    }
    if(showVoteEvents.has(event.name)){
      if(vote == true){
        return "ja";
      } else if(vote == false){
        return "nein";
      }
    }
    return "hidden";
  }
  isPlayerSelectable(player){
    /*To be selectable:
      -IF picking is president pick or chancellor pick, cannot be current President, Chancellor, 
       previous president or chancellor.
      -Player cannot be you.
      -Player needs to be alive.
      -You must be president*/
    const yourPID = this.props.yourPID;
    let event = this.props.fullEvent;
    let presID = event.details.presidentPID;
    let chanID = event.details.chancellorPID;
    let prevPres = event.details.previousPresPID;
    let prevChan = event.details.previousChanPID;
    const youArePresident = yourPID == presID;
    if(yourPID != presID){
      return false;
    };
    let cantSelect = new Set();
    let selectEvents=new Set(['chancellor pick', 'president pick', 'president kill', 'president investigate'])
    if(event.name == 'chancellor pick'){
      cantSelect.add(prevChan);
      cantSelect.add(prevPres);
      cantSelect.add(presID);
    } else if(event.name == 'president pick'){
      cantSelect.add(presID);
      cantSelect.add(chanID);
    }
    if(player.alive && !cantSelect.has(""+player.PID) && selectEvents.has(event.name)){
      return true;
    }
    return false;
  }
  render(){
    let order = this.props.order;
    let yourPID = this.props.yourPID;
    let players = this.props.players;
    let memberships = this.props.memberships;
    let eventDetails = this.props.fullEvent.details;
    let pres = eventDetails.presidentPID;
    let chan = eventDetails.chancellorPID;
    let uiInfo = this.props.uiInfo;
    let bulletIndex = this.props.uiInfo.bulletIndex;

    let playerList = order.map((PID, index)=>{
      let player = players[PID];
      if(!player){
        console.log(`No player with PID ${PID}`);
        return null;
      }
      const isYou = (PID == yourPID) ? "you " : ""; 
      const status =  this.getStatus(player)
      const voteStatus = this.getVoteClass(player); //Outputs event.votes[PID] if both exist. null/undefined otherwise.
      const membership = this.getMembership(player);
      const selectable = this.isPlayerSelectable(player);
      const isSelected = (PID == uiInfo.selectedPlayer);
      const isKillingPlayer = (this.props.fullEvent.name == "president kill");
      const hasBullet = (isSelected && isKillingPlayer);
      return (
      <div key={index} className={`player ${membership} ${isYou}`}>
        {isKillingPlayer && (
          <div className="bullet-holder">
            {hasBullet && <img className="bullet" src={bullet}/>}
          </div>
         )}

        <div className={`player-bar ${(isSelected && !hasBullet ) ? "selected" : ""} ${selectable ? "selectable" : ""}`} 
              onClick={()=>{if(selectable){this.changeSelectedPlayer(PID)}}}>
          {status == "president" && <img className="pres hat" src={presHat}/>/*He get hat*/}
          {status == "chancellor" && <img className="chan hat" src={chanHat}/>/*He also get hat*/}
          {status == "dead" && <img className="bullet-holes" src={bulletHole}/>}
          <div className={'vote ' + voteStatus}>
            {voteStatus == "ja" ? (<img src={ja}/>):null}
            {voteStatus == "nein" ? (<img src={nein}/>):null}
            {voteStatus == "sent" ? (<img src={sent}/>):null}
          </div>
          <h2 className="username">{players[PID].username}</h2>
        </div>
      </div>
      )
    });
    return (
      <div className={`player-sidebar ${this.state.closed ? "closed" : ""}`}>
        <div className="players">
          {playerList}
        </div>
        <button onClick={this.toggleState} className={`controller ${this.state.closed ? "toggled" : ""}`}>
          <h1>{">"}</h1>
        </button>
      </div>
    )
  }
}