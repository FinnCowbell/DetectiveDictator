import { GameEndEvent, GameEvent, PlayerAction } from "./GameEvent";
import { PID, Player } from "./Player";

export interface GameInfo {
  order: PID[];
  style: number;
}

export interface GameEventInfo {
  you: Player
  currentEvent: GameEvent;
  libBoard: number;
  fasBoard: number;
  marker: number;
  presidentPID?: PID;
  chancellorPID?: PID;
  previousPresidentPID?: PID | null;
  previousChancellorPID?: PID | null;
  votes?: { [key: PID]: boolean };
  nInDraw?: number;
  nInDiscard?: number;
  investigate?: PID;
  investigatedName?: string;
  victim?: PID;
}

export interface PlayerMap {
  [key: PID]: Player;
}

export interface Round {
  gameInfo: GameInfo;
  players: PlayerMap;
  states: GameEventInfo[];
  reason?: GameEndEvent;
}

export interface UIInfo {
  selectedPlayer?: PID;
  voteReceived: boolean;
  voted: { [key: PID]: boolean };
  disconnected: { [key: PID]: boolean };
}

export interface GameState {
  rounds: Round[];
  uiInfo: UIInfo;
}
