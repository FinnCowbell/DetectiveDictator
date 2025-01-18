import React, { useState } from "react";
import liberalPolicy from "../../media/liberal-policy.png";
import fascistPolicy from "../../media/fascist-policy.png";
import liberalMembership from "../../media/liberal-membership.png";
import fascistMembership from "../../media/fascist-membership.png";
import jaPic from "../../media/hands/ja.png";
import neinPic from "../../media/hands/nein.png";
import { Socket } from "socket.io-client";
import { GameEventInfo, PlayerMap, UIInfo } from "../../model/GameState";
import { PID, Player } from "../../model/Player";
import { PlayerAction } from "../../model/GameEvent";
import { CardValue } from "../../model/Card";
import { Membership } from "../../model/Membership";

interface ActionBarProps {
  socket: Socket;
  currentState: GameEventInfo;
  players: PlayerMap;
  you: Player;
  uiInfo: UIInfo;
};

export default class ActionBar extends React.Component<ActionBarProps> {
  constructor(props: ActionBarProps) {
    super(props);
    this.pickPresident = this.pickPresident.bind(this);
    this.pickChancellor = this.pickChancellor.bind(this);
    this.sendVetoRequest = this.sendVetoRequest.bind(this);
    this.sendVetoConfirmation = this.sendVetoConfirmation.bind(this);
    this.discardPolicy = this.discardPolicy.bind(this);
    this.castVote = this.castVote.bind(this);
    this.viewPlayer = this.viewPlayer.bind(this);
    this.doneViewing = this.doneViewing.bind(this);
  }
  pickChancellor() {
    let socket = this.props.socket;
    let selectedPlayer = this.props.uiInfo.selectedPlayer;
    if (selectedPlayer != null) {
      socket.emit("chancellor picked", {
        pickedChancellor: selectedPlayer,
      });
    }
  }
  castVote(isJa?: boolean) {
    if (isJa == undefined) {
      return;
    }
    this.props.socket.emit("cast vote", { vote: isJa });
  }
  discardPolicy(policyIndex: number) {
    if (policyIndex < 0) {
      return;
    }
    let actions = {
      "your president discard": () =>
        this.props.socket.emit("president discarding", {
          policyIndex: policyIndex,
        }),
      "your chancellor discard": () =>
        this.props.socket.emit("chancellor discarding", {
          policyIndex: policyIndex,
        }),
    } as Partial<Record<PlayerAction, () => void>>;
    this.props.currentState.action && actions[this.props.currentState.action]?.();
  }

  sendVetoRequest(policyIndex?: number) {
    if (policyIndex == null) {
      return;
    }
    this.props.socket.emit("veto request", { policyIndex });
  }

  sendVetoConfirmation(isJa?: boolean) {
    if (isJa == undefined) {
      return;
    }
    this.props.socket.emit("confirm veto request", { isJa });
  }

  //Executive Actions
  doneViewing() {
    this.props.socket.emit("president done");
  }
  viewPlayer(PID?: number) {
    if (PID != null) {
      this.props.socket.emit("president investigate request", {
        investigated: PID,
      });
    }
  }
  pickPresident() {
    let selectedPlayer = this.props.uiInfo.selectedPlayer;
    if (selectedPlayer != null) {
      this.props.socket.emit("president picked", {
        pickedPresident: selectedPlayer,
      });
    }
  }
  killPlayer(PID?: PID) {
    let selectedPlayer = this.props.uiInfo.selectedPlayer;
    if (selectedPlayer != null) {
      this.props.socket.emit("president kill request", { victim: PID });
    }
  }

  render() {
    let content;
    let currentState = this.props.currentState;
    let selectedPlayer = this.props.uiInfo.selectedPlayer ?
      this.props.players[this.props.uiInfo.selectedPlayer] : undefined;
    let selectedUsername = selectedPlayer && selectedPlayer.username;
    let you = this.props.you;
    let uiInfo = this.props.uiInfo;
    let voted = uiInfo.voted || false;
    switch (currentState.action) {
      case "your chancellor pick":
        content = (
          <PickPlayer
            verb="Pick"
            confirm={this.pickChancellor}
            pickedName={selectedUsername}
          />
        );
        break;
      case "chancellor vote":
        content = (
          <JaNein confirm={this.castVote} voteReceived={voted[you.PID]} />
        );
        break;
      case "your president discard":
        content = (
          <Discard confirm={this.discardPolicy} policies={you.hand?.policies} />
        );
        break;
      case "your chancellor discard":
        content = (
          <Discard
            confirm={this.discardPolicy}
            veto={currentState.fasBoard >= 5 ? this.sendVetoRequest : undefined}
            policies={you.hand?.policies}
          />
        );
        break;
      case "your veto requested":
        content = <JaNein confirm={this.sendVetoConfirmation} />;
        break;
      case "your president peek":
        content = (
          <PresidentPeek
            policies={you.hand?.policies}
            confirm={this.doneViewing}
          />
        );
        break;
      case "your president pick":
        content = (
          <PickPlayer
            verb="Nominate"
            confirm={this.pickPresident}
            pickedName={selectedUsername}
          />
        );
        break;
      case "your president kill":
        content = (
          <PickPlayer
            verb="Murder"
            pickedName={selectedUsername}
            confirm={() => this.killPlayer(this.props.uiInfo.selectedPlayer)}
            />
        );
        break;
      case "your president investigate":
        //Reusing pick chancellor window.
        content = (
          <PickPlayer
            verb="Investigate"
            pickedName={selectedUsername}
            confirm={() => this.viewPlayer(this.props.uiInfo.selectedPlayer)}
          />
        );
        break;
      case "your president investigated":
        content = (
          <ViewMembership
            membership={you.hand?.investigatedMembership}
            confirm={this.doneViewing}
          />
        );
        break;
      case "liberal win hitler":
      case "liberal win cards":
      case "fascist win hitler":
      case "fascist win cards":
      default:
        content = <div className="action empty"></div>;
        break;
    }
    return (
      <div className="action-bar-container">
        <div className="action-bar">{content}</div>
      </div>
    );
  }
}

function PickPlayer(props: {
  verb: string;
  selected?: number;
  confirm: () => void;
  pickedName?: string;
}) {
  let verb = props.verb;
  return (
    <div className="action pick-player">
      <button
        className={"pick-button " + !props.pickedName ? "disabled" : ""}
        onClick={props.confirm}
      >
        <h1>{props.pickedName ? `${verb} ${props.pickedName}` : "Select a player"}</h1>
      </button>
    </div>
  );
}

function JaNein(props: {
  confirm: (isJa: boolean) => void;
  voteReceived?: boolean;
}) {
  const [isJa, setIsJa] = useState(false);
  if (props.voteReceived) {
    return (
      <div className="action ja-nein">
        <div className="vote-options">
          <div className={"option"}>
            <img
              width={138}
              className={"selected"}
              src={isJa === true ? jaPic : neinPic}
            />
          </div>
        </div>
      </div>
    );
  } //else
  return (
    <div className="action ja-nein">
      <div className="vote-options">
        <button className="option">
          <img
            width={138}
            className={isJa ? "selected" : ""}
            onClick={() => setIsJa(true)}
            src={jaPic}
          />
        </button>
        <button className="option">
          <img
            width={138}
            className={isJa === false ? "selected" : ""}
            onClick={() => setIsJa(false)}
            src={neinPic}
          />
        </button>
      </div>
      <button
        onClick={() => props.confirm(isJa)}
        className={`vote-button ${props.voteReceived ? "hidden" : ""}`}
      >
        <h2>Cast Vote</h2>
      </button>
    </div>
  );
}

function Discard(props: {
  confirm: (i: number) => void;
  veto?: (i: number) => void;
  policies?: number[];
  fasBoard?: number;
}) {
  const [selectedCard, setSelectedCard] = useState(-1);
  function selectCard(i: number) {
    if (!props.policies || i < 0 || i > props.policies.length) {
      return;
    }
    setSelectedCard(i);
  }
  let cards = props.policies?.map((value, index) => (
    <PolicyCard
      key={index}
      isSelected={index == selectedCard}
      cardValue={value}
      onClick={() => selectCard(index)}
    />
  ));
  return (
    <div className="action discard">
      <div className="policy-cards">{cards}</div>
      {props.veto ? (
        <div className="stacked-buttons">
          <button
            className="discard-button"
            onClick={() => props.confirm(selectedCard)}
          >
            <h3>Discard</h3>
          </button>
          <button
            className="veto-button"
            onClick={() => props.veto!(selectedCard)}
          >
            <h3>Veto</h3>
          </button>
        </div>
      ) : (
        <button
          className="discard-button"
          onClick={() => props.confirm(selectedCard)}
        >
          <h2>Discard</h2>
        </button>
      )}
    </div>
  );
}

const PolicyCard: React.FC<{
  isSelected: boolean;
  cardValue: CardValue;
  onClick?: () => void;
}> = (props) => {
  const isFascist: boolean = props.cardValue === CardValue.Fascist;
  return (
    <div
      onClick={props.onClick}
      className={`policy ${isFascist ? "fascist" : "liberal"} ${props.isSelected ? "selected" : ""
        }`}
    >
      <img src={isFascist ? fascistPolicy : liberalPolicy}></img>
    </div>
  );
}

const PresidentPeek: React.FC<{
  policies?: CardValue[];
  confirm: () => void;
}> = (props) => {
  let cards = props.policies?.map((value, index) => (
    <PolicyCard key={index} isSelected={false} cardValue={value} />
  ));
  return (
    <div className="action view-three">
      <div className="policy-cards">{cards}</div>
      <button className="continue-button" onClick={props.confirm}>
        <h2>Continue</h2>
      </button>
    </div>
  );
}
const ViewMembership: React.FC<{
  membership?: Membership;
  confirm: () => void;
}> = (props) => {
  return (
    <div className="action membership">
      <div className="membership-card">
        {
          props.membership == 0 ? (
            <img src={liberalMembership} />
          ) : props.membership == 1 ? (
            <img src={fascistMembership} />
          ) : (
            <h1>?</h1>
          )
        }
      </div>
      <button className="continue-button" onClick={props.confirm}>
        <h2>Continue</h2>
      </button>
    </div>
  );
}
