import React from "react";

import bullet from "../../media/sidebar/bullet.png";
import ja from "../../media/hands/ja.png";
import nein from "../../media/hands/nein.png";
import sent from "../../media/hands/fist.png";
import presHat from "../../media/sidebar/president-hat.png";
import chanHat from "../../media/sidebar/chancellor-hat.png";
import bulletHole from "../../media/sidebar/bullet-holes.png";
import { PlayerAction } from "../../model/GameEvent";
import { PID, Player } from "../../model/Player";

import { ICurrentGameContext } from "../../GameDetails";
import { css } from "../../helpers/css";

type Props = ICurrentGameContext & { isMobile?: boolean };
interface State {
  closed: boolean;
}

export default class PlayerSidebar extends React.Component<Props, State> {
  constructor(props: Props) {
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
  getMembership(player: Player) {
    const membershipClasses = {
      "-1": "unknown",
      0: "liberal",
      1: "fascist",
      2: "hitler",
    };
    return membershipClasses[player.membership] || "unknown";
  }
  changeSelectedPlayer(PID: number) {
    this.props.sendUIInfo({
      name: "select player",
      PID: PID,
    });
  }
  getStatus(player: Player) {
    if (player.alive && player.PID == this.props.presidentPID) {
      return "president";
    } else if (player.alive && player.PID == this.props.chancellorPID) {
      return "chancellor";
    } else if (!player.alive) {
      return "dead";
    } else {
      return "";
    }
  }
  isConnected(player: Player): boolean {
    if (this.props.uiInfo.disconnected[player.PID] !== undefined) {
      return !this.props.uiInfo.disconnected[player.PID];
    } else {
      return player.connected;
    }
  }
  getVoteClass(player: Player): 'sent' | 'ja' | 'nein' | 'hidden' | undefined {
    //Gets the vote class
    //Ja, Nein, or Sent.
    //Sent = event is 'chancellor vote' and vote is true.
    const showVoteEvents = new Set<PlayerAction>([
      "president discard",
      "chancellor discard",
      "liberal policy placed",
      "fascist policy placed",
      "chancellor not voted",
      "end game",
    ]);
    let reason = this.props.reason;
    let votes = this.props.votes || {};
    let vote = votes[player.PID];
    let voted = this.props.uiInfo.voted || {};
    if (this.props.currentEvent == "chancellor vote" && voted[player.PID]) {
      return "sent";
    } else if (showVoteEvents.has(this.props.currentEvent)) {
      // Special case: If hitler is elected in then we'll want to know what the votes were.
      if (
        vote === undefined ||
        (this.props.currentEvent == "end game" &&
          reason != "fascist win hitler")
      ) {
        return "hidden";
      } else {
        return vote ? "ja" : "nein";
      }
    } else {
      return "hidden";
    }
  }
  isPlayerSelectable(player: Player) {
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
    const playerAction = this.props.playerAction;
    const presID = this.props.presidentPID;
    const chanID = this.props.chancellorPID;
    const prevPres = this.props.previousPresPID;
    const prevChan = this.props.previousChanPID;
    const you = this.props.you;
    if (!you || you.PID != presID) {
      return false;
    }
    const cantSelect = new Set();
    const selectEvents = new Set([
      "your chancellor pick",
      "your president pick",
      "your president kill",
      "your president investigate",
    ]);
    if (playerAction == "your chancellor pick") {
      cantSelect.add(prevChan);
      cantSelect.add(prevPres);
      cantSelect.add(presID);
    } else if (playerAction == "your president pick") {
      cantSelect.add(presID);
      cantSelect.add(chanID);
    }
    return (
      player.alive &&
      !cantSelect.has(player.PID) &&
      selectEvents.has(playerAction)
    )
  }
  render() {
    const order = this.props.gameInfo.order;
    const players = this.props.players;
    const you = this.props.you;
    const uiInfo = this.props.uiInfo;

    const playerList = order.map((PID: PID, index: number) => {
      const player = players[PID];
      const isYou = PID == you.PID ? "you " : "";
      const status = this.getStatus(player);
      const voteStatus = this.getVoteClass(player); //Null/undefined if doesnt exist.
      const disconnected: boolean = !this.isConnected(player);
      const membershipClass = this.getMembership(player);
      const borderClass = membershipClass + '-border';
      const selectable = this.isPlayerSelectable(player);
      const isSelected = PID == uiInfo.selectedPlayer;
      const isKillingPlayer =
        this.props.currentEvent == "president kill";
      const hasBullet = isSelected && isKillingPlayer;
      return (
        <div key={index} className={`player ${borderClass}  ${disconnected ? "disconnected" : ""}`}>
          <div className={`player-inner ${membershipClass} ${isYou}`}
            onClick={() => {
              if (selectable) {
                this.changeSelectedPlayer(PID);
              }
            }}>
            {isKillingPlayer && (
              <div className="bullet-holder">
                {hasBullet && <Decoration className="bullet" src={bullet} />}
              </div>
            )}

            <div
              className={`player-bar ${isSelected && !hasBullet ? "selected" : ""
                } ${selectable ? "selectable" : ""}`}
            >
              {
                status == "president" && (
                  <Decoration className="pres hat" src={presHat} />
                ) /*He get hat*/
              }
              {
                status == "chancellor" && (
                  <Decoration className="chan hat" src={chanHat} />
                ) /*He also get hat*/
              }
              {status == "dead" && (
                <Decoration className="bullet-holes" src={bulletHole} />
              )}
              <div className={"vote " + voteStatus}>
                {voteStatus == "ja" && <Decoration src={ja} />}
                {voteStatus == "nein" && <Decoration src={nein} />}
                {voteStatus == "sent" && <Decoration src={sent} />}
              </div>
              <h2 className="username">{players[PID].username}</h2>
            </div>
          </div>
        </div >
      );
    });
    return (
      <div className={css('player-sidebar', { 'closed': this.state.closed, 'is-mobile': !!this.props.isMobile })
      }>
        <div className="players">{playerList}</div>
        {
          !this.props.isMobile && <button
            onClick={this.toggleState}
            className={`toggle-button ${this.state.closed ? "toggled" : ""}`}>
            <h1>{this.state.closed ? "<" : ">"}</h1>
          </button>
        }
      </div >
    );
  }
}

const Decoration: React.FC<Partial<Pick<HTMLImageElement, 'className' | 'src'>>> = ({ className, src }) => {
  return <img className={className} draggable={false} src={src} />
}