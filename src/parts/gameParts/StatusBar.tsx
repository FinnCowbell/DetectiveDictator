import React from "react";
import useStatusPhrase from "./StatusPhrases";
import { useIsMobile } from "../../hooks/useIsMobile";
import { css } from "../../helpers/css";

export default function StatusBar() {
  const isMobile = useIsMobile();
  const gameStatus: string | undefined = useStatusPhrase();

  return (
    <div className={css("status-bar", { 'is-mobile': isMobile })}>
      <div className="status-div">
        <div>
          {gameStatus && (
            <h2 className="status">{gameStatus?.toUpperCase()}</h2>
          )}
        </div>
      </div>
    </div>
  );
}
