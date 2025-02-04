import { GameEndEvent, GameEvent } from "./GameEvent";
import { PID, Player } from "./Player";

export interface GameInfo {
  order: PID[];
  style: number;
}

export interface UIInfoEvent {
  name: string;
  PID: PID;
}

export interface GameEventInfo {
  you: Player
  currentEvent: GameEvent;
  libBoard: number;
  fasBoard: number;
  marker: number;
  presidentPID?: PID;
  chancellorPID?: PID;
  previousPresPID?: PID | null;
  previousChanPID?: PID | null;
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
  uiEvents?: UIInfoEvent[];
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
