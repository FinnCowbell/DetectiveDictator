import React from 'react'
import bullet from '../media/Bullet.png';
import ja from '../media/ja.png';
import nein from '../media/nein.png';
import sent from '../media/fist.png';
let presHat = './media/president-hat.png';
let chanHat = './media/chancellor-hat.png';

export default class PlayerSidebar extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      closed: false,
    }
    this.toggleState = this.toggleState.bind(this);
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
  getStatus(player){
    let details = this.props.event.details;
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
    let event = this.props.event;
    let votes = event.details.votes || {};
    let vote = votes[player.PID];
    let voted = this.props.uiInfo.voted || {};
    console.log(this.props.uiInfo);
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
    //To be selectable:
    //IF picking is president pick or chancellor pick, cannot be current President, Chancellor, previous president or chancellor.
    //Player cannot be you.
    //Player needs to be alive.
    //You must be president
    const yourPID = this.props.yourPID;
    let event = this.props.event;
    const playersAreSelectable = yourPID == event.details.presidentPID;
    let unselectablePlayers = new Set([event.details.presidentPID]);
    if(event.name == 'chancellor pick'){
      unselectablePlayers.add(event.details.previousChanPID);
      unselectablePlayers.add(event.details.previousPresPID);
    }
    if(event.name == 'president pick'){
      unselectablePlayers.add(event.details.chancellorPID);
    }
    if(playersAreSelectable && player.PID != yourPID && player.alive != false){//you can never select yourself
      if(!unselectablePlayers.has(player.PID)){
        return true;
      }
    }
    return false;
  }
  render(){
    let order = this.props.order;
    let yourPID = this.props.yourPID;
    let players = this.props.players;
    let memberships = this.props.memberships;
    let eventDetails = this.props.event.details;
    let pres = eventDetails.presidentPID;
    let chan = eventDetails.chancellorPID;
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
      const isSelected = (PID == this.props.selectedPlayer);
      const isKillingPlayer = (this.props.event.name == "president kill");
      const hasBullet = (this.props.uiInfo.bulletIndex == index)|| (isSelected && yourPID == pres);
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
        <div className={'vote ' + voteStatus}>
          {voteStatus == "ja" ? (<img src={ja}/>) : null}
          {voteStatus == "nein" ? (<img src={nein}/>):null}
          {voteStatus == "sent" ? (<img src={sent}/>):null}
        </div>

        <div className={`player-bar ${isSelected ? "selected" : ""} ${selectable ? "selectable" : ""}`} 
              onClick={()=>{
                if(selectable){
                  this.props.changeSelectedPlayer(PID)
                  if(isKillingPlayer){
                    this.props.moveBullet(index)
                  }
                }
              }}>
          {status == "president" && <img className="pres hat" src={presHat}/>/*He get hat*/}
          {status == "chancellor" && <img className="chan hat" src={chanHat}/>/*He also get hat*/}
          <div className={'status ' + status}>
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
          <h1>></h1>
        </button>
      </div>
    )
  }
}