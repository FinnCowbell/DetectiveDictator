import React from "react";
import getStatusPhrase from "./StatusPhrases";
import { GameEventInfo, PlayerMap } from "../../model/GameState";
import { Player } from "../../model/Player";
export default function StatusBar(props: {
  currentState: GameEventInfo,
  players: PlayerMap
}) {
  let gameStatus = getStatusPhrase(props.currentState, props.players);
  return (
    <div className="status-bar">
      <div className="status-div">
        {props.currentState && (
          <h2 className="status">{gameStatus?.toUpperCase()}</h2>
        )}
      </div>
    </div>
  );
}
