import React from "react";
import { ActionBar } from "./ActionBar";
import { useGameDetails } from "../../GameDetails";
import { css } from "../../helpers/css";
import { PlayerAction, PlayerActions } from "../../model/GameEvent";

export const ActionBarDrawer: React.FC<{}> = () => {
  const [isOpened, setIsOpened] = React.useState(false);
  const { playerAction, uiInfo } = useGameDetails();

  React.useEffect(() => {
    const AUTO_OPEN_ACTIONS: PlayerAction[] = [PlayerActions.YOUR_VETO_REQUESTED,
    PlayerActions.YOUR_PRESIDENT_PEEK,
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
  }, [playerAction, uiInfo.selectedPlayer]);


  return (
    <div className={css('action-bar-placeholder')}>
      <div className={css('floating-region', { 'is-opened': isOpened })}>
        <button className="toggle-button" onClick={() => { setIsOpened((prev) => !prev) }}>
          ^
        </button>
        <ActionBar />
      </div>
    </div >
  )
};