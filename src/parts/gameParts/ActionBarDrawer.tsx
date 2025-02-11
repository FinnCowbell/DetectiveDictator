/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { ActionBar } from "./ActionBar";
import { useGameDetails } from "../../GameDetails";
import { css } from "../../helpers/css";
import { PlayerAction, PlayerActions } from "../../model/GameEvent";

function throttle(func: any, limit: number) {
  let inThrottle: boolean;
  return function (...args: any[]) {
    if (!inThrottle) {
      //@ts-expect-error - w/e
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export const ActionBarDrawer: React.FC<{}> = () => {
  const [isOpened, setIsOpened] = React.useState(false);
  const { playerAction, uiInfo, you, spectating } = useGameDetails();
  const [prevAction, setPrevAction] = React.useState<PlayerAction | null>(null);

  React.useEffect(() => {
    if (prevAction === playerAction) {
      // Prevent automatic actions from happening more than once.
      return;
    }
    setPrevAction(playerAction);

    const AUTO_OPEN_ACTIONS: PlayerAction[] = [PlayerActions.YOUR_VETO_REQUESTED,
    PlayerActions.YOUR_PRESIDENT_PICK,
    PlayerActions.YOUR_PRESIDENT_KILL,
    PlayerActions.YOUR_PRESIDENT_INVESTIGATE,
    PlayerActions.YOUR_PRESIDENT_INVESTIGATED,
    PlayerActions.CHANCELLOR_VOTE
    ];

    const SELECT_PLAYER_ACTIONS: PlayerAction[] = [PlayerActions.YOUR_CHANCELLOR_PICK,
    PlayerActions.YOUR_PRESIDENT_PICK,
    PlayerActions.YOUR_PRESIDENT_KILL,
    PlayerActions.YOUR_PRESIDENT_INVESTIGATE,
    ];
    if (AUTO_OPEN_ACTIONS.includes(playerAction) ||
      (SELECT_PLAYER_ACTIONS.includes(playerAction) && uiInfo.selectedPlayer != null)) {
      setIsOpened(true);
    }
  }, [prevAction, playerAction, uiInfo.selectedPlayer, uiInfo.voted, you.PID]);

  const closeDrawer = React.useCallback(() => {
    setIsOpened(false);
  }, []);

  const openDrawer = React.useCallback(() => {
    setIsOpened(true);
  }, []);

  const debouncedToggleOpen = React.useCallback(throttle((ev: { preventDefault: () => void; }) => {
    setIsOpened((isOpened) => !isOpened);
    ev.preventDefault();
  }, 100), []);

  if (!you.alive || spectating) {
    return null;
  }

  return (
    <div className={css('action-bar-placeholder')}>
      <div className={css('floating-region', { 'is-opened': isOpened })}>
        <button className="toggle-button"
          onClick={debouncedToggleOpen}
          onTouchStart={debouncedToggleOpen}
          // Prevent from accidently triggering a click on inner elements.
          onTouchEnd={(ev) => ev.preventDefault()}
        >
          ^
        </button>
        <ActionBar isEmpty={!isOpened} closeDrawer={closeDrawer} openDrawer={openDrawer} />
      </div>
    </div >
  )
};