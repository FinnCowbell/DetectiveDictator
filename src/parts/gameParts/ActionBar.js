import React, { useState } from "react";
import liberalPolicy from "../../media/liberal-policy.png";
import fascistPolicy from "../../media/fascist-policy.png";
import liberalMembership from "../../media/liberal-membership.png";
import fascistMembership from "../../media/fascist-membership.png";
import jaPic from "../../media/hands/ja.png";
import neinPic from "../../media/hands/nein.png";

export default class ActionBar extends React.Component {
  constructor(props) {
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
  castVote(isJa = null) {
    if (isJa == null) {
      return;
    }
    this.props.socket.emit("cast vote", { vote: isJa });
  }
  discardPolicy(policyIndex) {
    if (policyIndex === null) {
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
    };
    actions[this.props.currentState.action]();
  }

  sendVetoRequest(policyIndex) {
    if (policyIndex === null) {
      return;
    }
    this.props.socket.emit("veto request", { policyIndex: policyIndex });
  }

  sendVetoConfirmation(isJa = null) {
    if (isJa == null) {
      return;
    }
    this.props.socket.emit("confirm veto request", { isJa: isJa });
  }

  //Executive Actions
  doneViewing() {
    this.props.socket.emit("president done");
  }
  viewPlayer(PID) {
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
  killPlayer(PID) {
    let selectedPlayer = this.props.uiInfo.selectedPlayer;
    if (selectedPlayer != null) {
      this.props.socket.emit("president kill request", { victim: PID });
    }
  }
  render() {
    let content;
    let currentState = this.props.currentState;
    let selectedPlayer =
      this.props.players[this.props.uiInfo.selectedPlayer] || null;
    let selectedUsername = selectedPlayer && selectedPlayer.username;
    let you = this.props.you;
    let uiInfo = this.props.uiInfo;
    let voted = uiInfo.voted || false;
    switch (currentState.action) {
      case "your chancellor pick":
        content = (
          <PickPlayer
            verb="Pick"
            selected={this.props.uiInfo.selectedPlayer}
            confirm={this.pickChancellor}
            username={selectedUsername}
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
          <Discard confirm={this.discardPolicy} policies={you.hand.policies} />
        );
        break;
      case "your chancellor discard":
        content = (
          <Discard
            confirm={this.discardPolicy}
            veto={this.sendVetoRequest}
            fasBoard={currentState.fasBoard}
            policies={you.hand.policies}
          />
        );
        break;
      case "your veto requested":
        content = <JaNein confirm={this.sendVetoConfirmation} />;
        break;
      case "your president peek":
        content = (
          <PresidentPeek
            policies={you.hand.policies}
            confirm={this.doneViewing}
          />
        );
        break;
      case "your president pick":
        content = (
          <PickPlayer
            verb="Nominate"
            confirm={this.doneViewing}
            selected={this.props.uiInfo.selectedPlayer}
            confirm={this.pickPresident}
            username={selectedUsername}
          />
        );
        break;
      case "your president kill":
        content = (
          // <div className="bullet"/>
          <PickPlayer
            verb="Murder"
            confirm={this.doneViewing}
            selected={this.props.uiInfo.selectedPlayer}
            confirm={() => this.killPlayer(this.props.uiInfo.selectedPlayer)}
            username={selectedUsername}
          />
        );
        break;
      case "your president investigate":
        //Reusing pick chancellor window.
        content = (
          <PickPlayer
            verb="Investigate"
            username={selectedUsername}
            selected={this.props.uiInfo.selectedPlayer}
            confirm={() => this.viewPlayer(this.props.uiInfo.selectedPlayer)}
          />
        );
        break;
      case "your president investigated":
        content = (
          <ViewMembership
            membership={you.hand.investigatedMembership}
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

function PickPlayer(props) {
  let verb = props.verb;
  let username = props.username;
  return (
    <div className="action pick-player">
      <button
        className={"pick-button " + !props.selected ? "disabled" : ""}
        onClick={props.confirm}
      >
        <h1>{props.username ? `${verb} ${username}` : "Select a player"}</h1>
      </button>
    </div>
  );
}

function JaNein(props) {
  const [isJa, setIsJa] = useState(null);
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

function Discard(props) {
  const [selectedCard, setSelectedCard] = useState(null);
  function selectCard(i) {
    if (i < 0 || i > props.policies.length) {
      return;
    }
    setSelectedCard(i);
  }
  let cards = props.policies.map((value, index) => (
    <PolicyCard
      key={index}
      isSelected={index == selectedCard}
      isFascist={value}
      onClick={() => selectCard(index)}
    />
  ));
  return (
    <div className="action discard">
      <div className="policy-cards">{cards}</div>
      {props.fasBoard == 5 && props.veto ? (
        <div className="stacked-buttons">
          <button
            className="discard-button"
            onClick={() => props.confirm(selectedCard)}
          >
            <h3>Discard</h3>
          </button>
          <button
            className="veto-button"
            onClick={() => props.veto(selectedCard)}
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

function PolicyCard(props) {
  //Takes Select, Index, and isFascist.
  return (
    <div
      onClick={props.onClick}
      className={`policy ${props.isFascist ? "fascist" : "liberal"} ${props.isSelected ? "selected" : ""
        }`}
    >
      <img src={props.isFascist ? fascistPolicy : liberalPolicy}></img>
    </div>
  );
}

function PresidentPeek(props) {
  let policyValues = props.policies;
  let cards = policyValues.map((value, index) => (
    <PolicyCard key={index} isSelected={false} isFascist={value} />
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
function ViewMembership(props) {
  return (
    <div className="action membership">
      <div className="membership-card">
        <img
          src={props.membership == 0 ? liberalMembership : fascistMembership}
        />
      </div>
      <button className="continue-button" onClick={props.confirm}>
        <h2>Continue</h2>
      </button>
    </div>
  );
}

function Murder(props) {
  return (
    <div className="action murder">
      <button
        className={!this.props.selected ? "disabled" : ""}
        onClick={this.props.confirm}
      >
        {this.props.selected
          ? "Murder " + this.props.selected
          : "Choose A Target"}
      </button>
    </div>
  );
}
