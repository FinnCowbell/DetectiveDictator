import React, { useCallback, useEffect, useMemo, useState } from "react";

import { LibBoard, FasBoard } from "./parts/gameParts/Boards";
import { ActionBar } from "./parts/gameParts/ActionBar";
import StatusBar from "./parts/gameParts/StatusBar";
import PlayerSidebar from "./parts/gameParts/PlayerSidebar";
import PlayerCard from "./parts/gameParts/PlayerCard";
import EndWindow from "./parts/gameParts/EndWindow";

import { PID } from "./model/Player";
import { useSocketContext } from "./SocketContext";
import { useGameDetails } from "./GameDetails";
import { useIsMobile } from "./hooks/useIsMobile";
import { Eye } from "./parts/gameParts/Eye";
import { ActionBarDrawer } from "./parts/gameParts/ActionBarDrawer";
import ChatRoom from "./parts/ChatRoom";
import { GameEvent, GameEvents, PlayerAction } from "./model/GameEvent";

interface Props {
  yourPID?: PID;
}

const Hitler: React.FC<Props> = () => {
  const gameDetails = useGameDetails();
  const {
    you,
    gameInfo,
  } = gameDetails;
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileLayout />
  }

  return (
    <div className="game-window game-bg">
      <StatusBar />
      <PlayerCard you={you} />
      <PlayerSidebar
        {...gameDetails}
      />
      <div className="boards">
        <div className="board-container">
          <LibBoard
            draw={gameDetails.nInDraw}
            discard={gameDetails.nInDiscard}
            marker={gameDetails.marker}
            nCards={gameDetails.libBoard}
          />
          <FasBoard nCards={gameDetails.fasBoard} nPlayers={gameInfo.order.length} />
        </div>
      </div>
      {you?.alive && (
        <ActionBar />
      )}
      {gameDetails.currentEvent == "end game" && gameDetails.reason && (
        <EndWindow reason={gameDetails.reason} />
      )}
    </div>
  );
};

const MobileLayout: React.FC<{}> = () => {
  const gameDetails = useGameDetails();
  const playerScreen = React.useRef<HTMLDivElement>(null);
  const boardScreen = React.useRef<HTMLDivElement>(null);
  const {
    gameInfo,
    togglePrivateInfo,
    playerAction,
    you
  } = gameDetails;

  // Start on the player screen
  React.useEffect(() => {
    playerScreen.current?.scrollIntoView({ behavior: 'instant', block: 'center' });
  }, []);

  React.useEffect(() => {
    const BOARD_EVENTS: PlayerAction[] = [
      GameEvents.LIBERAL_POLICY_PLACED,
      GameEvents.FASCIST_POLICY_PLACED,
    ];

    const PLAYER_EVENTS: PlayerAction[] = [
      'your chancellor pick',
      'your president investigate',
      'your president kill',
    ]
    if (BOARD_EVENTS.includes(playerAction)) {
      setTimeout(() => {
        boardScreen.current?.scrollIntoView({ behavior: "smooth", block: 'center' });
      }, 100);
    } else if (PLAYER_EVENTS.includes(playerAction)) {
      setTimeout(() => {
        playerScreen.current?.scrollIntoView({ behavior: "smooth", block: 'center' });
      }, 100);
    }
  }, [
    playerAction
  ]);



  return (
    <div className="mobile game-bg">
      <StatusBar />
      <div className="sliding-screens">
        <div className="screen chat-screen">
          <ChatRoom isCard />
        </div>
        <div ref={playerScreen} className="screen player-screen">
          <PlayerSidebar
            {...gameDetails}
            isMobile
          />
          {!gameDetails.reason && you.alive && (<Eye toggle={togglePrivateInfo} />)}
        </div>
        <div className="screen boards" ref={boardScreen}>
          <div className="boards-container">
            <LibBoard
              draw={gameDetails.nInDraw}
              discard={gameDetails.nInDiscard}
              marker={gameDetails.marker}
              nCards={gameDetails.libBoard}
            />
            <FasBoard nCards={gameDetails.fasBoard} nPlayers={gameInfo.order.length} />
          </div>
        </div>
      </div>
      <ActionBarDrawer />
      {gameDetails.currentEvent == "end game" && gameDetails.reason && (
        <EndWindow reason={gameDetails.reason} />
      )}

    </div >
  )
}

export default Hitler;