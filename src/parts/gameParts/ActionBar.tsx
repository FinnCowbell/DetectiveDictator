import React, { useState } from "react";
import liberalPolicy from "../../media/liberal-policy.png";
import fascistPolicy from "../../media/fascist-policy.png";
import liberalMembership from "../../media/liberal-membership.png";
import fascistMembership from "../../media/fascist-membership.png";
import discardedCard from "../../media/discarded-policy.png";
import jaPic from "../../media/hands/ja.png";
import neinPic from "../../media/hands/nein.png";
import { PID } from "../../model/Player";
import { PlayerAction } from "../../model/GameEvent";
import { CardValue } from "../../model/Card";
import { Membership } from "../../model/Membership";
import { useGameDetails } from "../../GameDetails";
import { useSocketContext } from "../../SocketContext";


export const ActionBar: React.FC<{
  openDrawer?: () => void;
  closeDrawer?: () => void;
  isEmpty?: boolean
}> = ({
  closeDrawer,
  isEmpty
}) => {
    const { socket } = useSocketContext();
    const {
      playerAction,
      uiInfo,
      players,
      fasBoard,
      you,
    } = useGameDetails();

    const pickChancellor = React.useCallback(() => {
      if (uiInfo.selectedPlayer != null) {
        socket.emit("chancellor picked", {
          pickedChancellor: uiInfo.selectedPlayer,
        });
      }
    }, [socket, uiInfo])

    const castVote = React.useCallback((isJa?: boolean) => {
      if (isJa == undefined) {
        return;
      }
      closeDrawer?.();
      socket.emit("cast vote", { vote: isJa });
    }, [socket, closeDrawer])

    const discardPolicy = React.useCallback((policyIndex: number) => {
      if (policyIndex < 0) {
        return;
      }
      let actions: Partial<Record<PlayerAction, () => void>> = {
        "your president discard": () =>
          socket.emit("president discarding", {
            policyIndex: policyIndex,
          }),
        "your chancellor discard": () =>
          socket.emit("chancellor discarding", {
            policyIndex: policyIndex,
          }),
      };
      playerAction && actions[playerAction]?.();
      closeDrawer?.();
    }, [
      playerAction,
      socket,
      closeDrawer
    ])

    const sendVetoRequest = React.useCallback((policyIndex?: number) => {
      if (policyIndex == null) {
        return;
      }
      socket.emit("veto request", { policyIndex });
      closeDrawer?.();
    }, [socket, closeDrawer])

    const sendVetoConfirmation = React.useCallback((isJa?: boolean) => {
      if (isJa == undefined) {
        return;
      }
      socket.emit("confirm veto request", { isJa });
    }, [socket])

    //Executive Actions
    const doneViewing = React.useCallback(() => {
      socket.emit("president done");
      closeDrawer?.();
    }, [socket, closeDrawer])

    const viewPlayer = React.useCallback((PID?: number) => {
      if (PID != null) {
        socket.emit("president investigate request", {
          investigated: PID,
        });
      }
    }, [socket]);

    const pickPresident = React.useCallback(() => {
      if (uiInfo.selectedPlayer != null) {
        socket.emit("president picked", {
          pickedPresident: uiInfo.selectedPlayer,
        });
      }
    }, [socket, uiInfo])

    const killPlayer = React.useCallback((pid?: PID) => {
      if (uiInfo.selectedPlayer != null) {
        socket.emit("president kill request", { victim: pid });
      }
    }, [socket, uiInfo])

    const content: JSX.Element = React.useMemo(() => {
      if (isEmpty) return (
        <div className="action empty"></div>
      )
      const selectedPlayer = players[uiInfo.selectedPlayer || -1];
      switch (playerAction) {
        case "your chancellor pick":
          return (
            <PickPlayer
              verb="Pick"
              confirm={pickChancellor}
              pickedName={selectedPlayer?.username}
            />
          );
        case "chancellor vote":
          return (
            <JaNein confirm={castVote} voteReceived={uiInfo.voted[you.PID]} />
          );
          break;
        case "your president discard":
          return (
            <Discard confirm={discardPolicy} policies={you.hand?.policies} />
          );
        case "your chancellor discard":
          return (
            <Discard
              confirm={discardPolicy}
              veto={fasBoard >= 5 ? sendVetoRequest : undefined}
              policies={you.hand?.policies}
            />
          );
        case "your veto requested":
          return <JaNein confirm={sendVetoConfirmation} />;
        case "your president peek":
          return (
            <PresidentPeek
              policies={you.hand?.policies}
              confirm={doneViewing}
            />
          );
        case "your president pick":
          return (
            <PickPlayer
              verb="Nominate"
              confirm={pickPresident}
              pickedName={selectedPlayer?.username}
            />
          );
        case "your president kill":
          return (
            <PickPlayer
              verb="Murder"
              pickedName={selectedPlayer?.username}
              confirm={() => killPlayer(uiInfo.selectedPlayer)}
            />
          );
        case "your president investigate":
          return (
            <PickPlayer
              verb="Investigate"
              pickedName={selectedPlayer?.username}
              confirm={() => viewPlayer(uiInfo.selectedPlayer)}
            />
          );
        case "your president investigated":
          return (
            <ViewMembership
              membership={you.hand?.investigatedMembership}
              confirm={doneViewing}
            />
          );
        case "liberal win hitler":
        case "liberal win cards":
        case "fascist win hitler":
        case "fascist win cards":
        default:
          return <div className="action empty"></div>;
      }
    }, [
      socket,
      playerAction,
      uiInfo,
      you,
      players,
      isEmpty
    ]);

    return (
      <div className="action-bar-container">
        <div className="action-bar">{content}</div>
      </div>
    );
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
  const [isJa, setIsJa] = useState<boolean | undefined>(undefined);
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
  }
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
        onClick={() => isJa !== undefined && props.confirm(isJa)}
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
  const [flipped, setFlipped] = useState(false);
  const [selectedCard, setSelectedCard] = useState(-1);
  function selectCard(i: number) {
    if (!flipped) {
      setFlipped(true);
      return;
    }
    if (!props.policies || i < 0 || i > props.policies.length) {
      return;
    }
    setSelectedCard(i);
  }
  const cards = props.policies?.map((value, index) => (
    <PolicyCard
      key={index}
      isSelected={index == selectedCard}
      cardValue={value}
      onClick={() => selectCard(index)}
      flipped={flipped}
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
            <h3>Destroy</h3>
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
          <h2>Destroy</h2>
        </button>
      )}
    </div>
  );
}

const PolicyCard: React.FC<{
  isSelected: boolean;
  cardValue: CardValue;
  onClick?: () => void;
  flipped?: boolean;
}> = (props) => {
  const cardClass = {
    [CardValue.Fascist]: 'fascist',
    [CardValue.Liberal]: 'liberal'
  }
  const cards = {
    [CardValue.Liberal]: liberalPolicy,
    [CardValue.Fascist]: fascistPolicy,
  }

  const onClick = () => {
    props.onClick?.();
  }
  return (
    <div
      onClick={onClick}
      className={`policy ${cardClass[props.cardValue]} ${props.flipped && 'flipped'} ${props.isSelected ? "selected" : ""
        }`}
    >
      <img src={cards[props.cardValue]}></img>
      <div className="selected-overlay">
        <img src={discardedCard} />
      </div>
    </div>
  );
}

const PresidentPeek: React.FC<{
  policies?: CardValue[];
  confirm: () => void;
}> = (props) => {
  const [flipped, setFlipped] = useState(false);
  const cards = props.policies?.map((value, index) => (
    <PolicyCard flipped={flipped} key={index} isSelected={false} cardValue={value} onClick={() => setFlipped(true)} />
  ));
  return (
    <div className="action view-three">
      <div className={`policy-cards ${!flipped ? 'flipped' : ''}`}>{cards}</div>
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
