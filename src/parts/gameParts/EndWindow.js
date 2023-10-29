import React from "react";
import { useGameContext } from "../../GameContext";

const EndWindow = ({ reason }) => {
  const { socket } = useGameContext();
  const joinNewLobby = () => { socket.emit("join new lobby") };

  const endPhrases = {
    "liberal win cards": "The Liberals Have Secured Germany.",
    "fascist win cards": "The Fascists Have Secured Germany.",
    "liberal win hitler": "Hitler Has Been Killed.",
    "fascist win hitler": "Hitler has been Elected.",
  };
  let fascistsWon = reason.includes("fascist") ? 1 : 0;
  return (
    <div
      className={`animation-overlay ${fascistsWon ? "fascist" : "liberal"}`}>
      <div className={`slidein-background`}></div>
      <div className="content">
        <h1>{endPhrases[reason]}</h1>
        <div className="buttons">
          <button onClick={joinNewLobby}>Join Next Game</button>
        </div>
      </div>
    </div>
  );
}

export default EndWindow;
