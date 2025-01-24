import React from "react";
import { useSocketContext } from "../../SocketContext";
import { GameEndEvent, PlayerAction } from "../../model/GameEvent";

const EndWindow: React.FC<{
  reason: GameEndEvent
}> = ({ reason }) => {
  const { socket } = useSocketContext();
  const joinNewLobby = () => { socket?.emit("join new lobby") };
  const [closed, setClosed] = React.useState(false);

  const endPhrases: Record<GameEndEvent, string> = {
    "liberal win cards": "The Liberals Have Secured Germany.",
    "fascist win cards": "The Fascists Have Secured Germany.",
    "liberal win hitler": "Hitler Has Been Killed.",
    "fascist win hitler": "Hitler has been Elected.",
  };

  return !closed ?  (
    <div
      className={`animation-overlay ${reason.includes("fascist") ? "fascist" : "liberal"}`}>
      <div className={`slidein-background`}></div>
      <div className="content">
        <div className="background"></div>
        <h1>{endPhrases[reason]}</h1>
        <div className="buttons">
          <button onClick={joinNewLobby}>Join Next Game</button>
        </div>
        <button onClick={() => setClosed(true)} className="close-window">x</button>
      </div>
    </div>
  ) : <></>;
}

export default EndWindow;
