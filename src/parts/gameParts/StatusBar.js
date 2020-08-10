import React from "react";
import getStatusPhrase from "./StatusPhrases";
export default function StatusBar(props) {
  let gameStatus = getStatusPhrase(props.currentState, props.players);
  return (
    <div className="status-bar">
      <div className="status-div">
        {props.currentState && (
          <h2 className="status">{gameStatus.toUpperCase()}</h2>
        )}
      </div>
    </div>
  );
}
