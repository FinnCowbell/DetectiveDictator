import { PlayerAction, GameEvents, PlayerActions } from "../model/GameEvent";
import { Round, GameEventInfo } from "../model/GameState";
import { PID } from "../model/Player";


export function usePlayerAction({ round, yourPid }: { round?: Round, yourPid?: PID }): PlayerAction {
  //Based on event info, constructs the 'action' for the specific player.
  //The action guides what shows up in the action bar, as well as the game status message.
  let currentState: GameEventInfo | undefined = round?.states && round?.states[round.states.length - 1];
  let action: PlayerAction;
  let youArePresident = yourPid && yourPid === currentState?.presidentPID;
  let youAreChancellor = yourPid && yourPid == currentState?.chancellorPID;
  switch (currentState?.currentEvent) {
    case GameEvents.CHANCELLOR_PICK:
      action = youArePresident ? PlayerActions.YOUR_CHANCELLOR_PICK : PlayerActions.CHANCELLOR_PICK;
      break;
    case "president discard":
      action = youArePresident
        ? "your president discard"
        : "president discard";
      break;
    case "chancellor discard":
      action = youAreChancellor
        ? "your chancellor discard"
        : "chancellor discard";
      break;
    case "veto requested":
      action = youArePresident ? "your veto requested" : "veto requested";
      break;
    case "president peek":
      action = youArePresident ? "your president peek" : "president peek";
      break;
    case "president pick":
      action = youArePresident ? "your president pick" : "president pick";
      break;
    case "president kill":
      action = youArePresident ? "your president kill" : "president kill";
      break;
    case "president investigate":
      action = youArePresident
        ? "your president investigate"
        : "president investigate";
      break;
    case "president investigated":
      action = youArePresident
        ? "your president investigated"
        : "president investigated";
      break;
    case GameEvents.END_GAME:
      action = round?.reason || "end game";
      break;
    default:
      action = currentState?.currentEvent || 'pre game';
      break;
  }
  return action;
}
