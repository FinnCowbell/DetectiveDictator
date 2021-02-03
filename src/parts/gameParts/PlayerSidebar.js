import React from "react";

import bullet from "../../media/sidebar/bullet.png";
import ja from "../../media/hands/ja.png";
import nein from "../../media/hands/nein.png";
import sent from "../../media/hands/fist.png";
import presHat from "../../media/sidebar/president-hat.png";
import chanHat from "../../media/sidebar/chancellor-hat.png";
import bulletHole from "../../media/sidebar/bullet-holes.png";

export default class PlayerSidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      closed: false,
    };
    this.toggleState = this.toggleState.bind(this);
    this.changeSelectedPlayer = this.changeSelectedPlayer.bind(this);
  }
  toggleState() {
    const status = !this.state.closed;
    this.setState({
      closed: status,
    });
  }
  getMembership(player) {
    const membershipClasses = {
      "-1": "",
      0: "liberal",
      1: "fascist",
      2: "hitler",
    };
    return membershipClasses[player.membership] || "";
  }
  changeSelectedPlayer(PID) {
    this.props.sendUIInfo({
      name: "select player",
      PID: PID,
    });
  }
  getStatus(player) {
    let currentState = this.props.currentState;
    if (player.alive && player.PID == currentState.presidentPID) {
      return "president";
    } else if (player.alive && player.PID == currentState.chancellorPID) {
      return "chancellor";
    } else if (!player.alive) {
      return "dead";
    } else {
      return "";
    }
  }
  getVoteClass(player) {
    //Gets the vote class
    //Ja, Nein, or Sent.
    //Sent = event is 'chancellor vote' and vote is true.
    const showVoteEvents = new Set([
      "president discard",
      "chancellor discard",
      "liberal policy placed",
      "fascist policy placed",
      "chancellor not voted",
      "end game",
    ]);
    let reason = this.props.reason;
    let currentState = this.props.currentState;
    let votes = currentState.votes || {};
    let vote = votes[player.PID];
    let voted = this.props.uiInfo.voted || {};
    if (currentState.currentEvent == "chancellor vote" && voted[player.PID]) {
      return "sent";
    }
    if (showVoteEvents.has(currentState.currentEvent)) {
      // Special case: If hitler is elected in then we'll want to know what the votes were.
      if (
        currentState.currentEvent == "end game" &&
        reason != "fascist win hitler"
      ) {
        return "hidden";
      } else {
        return vote == true ? "ja" : vote == false ? "nein" : null;
      }
    }
    return "hidden";
  }
  isPlayerSelectable(player) {
    /*To be selectable:
      -IF picking is president pick or chancellor pick, cannot be current President, Chancellor, 
       previous president or chancellor.
      -Player cannot be you.
      -Player needs to be alive.
      -You must be president*/
    if (Object.keys(this.props.players).length < 5) {
      //Dev mode assumed.
      return true;
    }
    let currentState = this.props.currentState;
    let currentEvent = currentState.currentEvent;
    let presID = currentState.presidentPID;
    let chanID = currentState.chancellorPID;
    let prevPres = currentState.previousPresPID;
    let prevChan = currentState.previousChanPID;
    let you = this.props.you;
    if (!you || you.PID != presID) {
      return false;
    }
    let cantSelect = new Set();
    let selectEvents = new Set([
      "chancellor pick",
      "president pick",
      "president kill",
      "president investigate",
    ]);
    if (currentEvent == "chancellor pick") {
      cantSelect.add(prevChan);
      cantSelect.add(prevPres);
      cantSelect.add(presID);
    } else if (currentEvent == "president pick") {
      cantSelect.add(presID);
      cantSelect.add(chanID);
    }
    if (
      player.alive &&
      !cantSelect.has(player.PID) &&
      selectEvents.has(currentEvent)
    ) {
      return true;
    }
    return false;
  }
  render() {
    let order = this.props.order;
    let players = this.props.players;
    let currentState = this.props.currentState;
    let you = this.props.you || {};
    let pres = currentState.presidentPID;
    let chan = currentState.chancellorPID;
    let uiInfo = this.props.uiInfo;
    let bulletIndex = this.props.uiInfo.bulletIndex;

    let playerList = order.map((PID, index) => {
      let player = players[PID];
      const isYou = PID == you.PID ? "you " : "";
      const status = this.getStatus(player);
      const voteStatus = this.getVoteClass(player); //Null/undefined if doesnt exist.
      const membershipClass = this.getMembership(player);
      const selectable = this.isPlayerSelectable(player);
      const isSelected = PID == uiInfo.selectedPlayer;
      const isKillingPlayer =
        this.props.currentState.currentEvent == "president kill";
      const hasBullet = isSelected && isKillingPlayer;
      return (
        <div key={index} className={`player ${membershipClass} ${isYou}`}>
          {isKillingPlayer && (
            <div className="bullet-holder">
              {hasBullet && <img className="bullet" src={bullet} />}
            </div>
          )}

          <div
            className={`player-bar ${
              isSelected && !hasBullet ? "selected" : ""
            } ${selectable ? "selectable" : ""}`}
            onClick={() => {
              if (selectable) {
                this.changeSelectedPlayer(PID);
              }
            }}>
            {
              status == "president" && (
                <img className="pres hat" src={presHat} />
              ) /*He get hat*/
            }
            {
              status == "chancellor" && (
                <img className="chan hat" src={chanHat} />
              ) /*He also get hat*/
            }
            {status == "dead" && (
              <img className="bullet-holes" src={bulletHole} />
            )}
            <div className={"vote " + voteStatus}>
              {voteStatus == "ja" ? <img src={ja} /> : null}
              {voteStatus == "nein" ? <img src={nein} /> : null}
              {voteStatus == "sent" ? <img src={sent} /> : null}
            </div>
            <h2 className="username">{players[PID].username}</h2>
          </div>
        </div>
      );
    });
    return (
      <div className={`player-sidebar ${this.state.closed ? "closed" : ""}`}>
        <div className="players">{playerList}</div>
        <button
          onClick={this.toggleState}
          className={`controller ${this.state.closed ? "toggled" : ""}`}>
          <h1>{this.state.closed ? "<" : ">"}</h1>
        </button>
      </div>
    );
  }
}
