
export const GameEvents = {
  PRE_GAME: "pre game",
  NEW_ROUND: "new round",
  PRESIDENT_DISCARD: "president discard",
  CHANCELLOR_DISCARD: "chancellor discard",
  CHANCELLOR_NOT_VOTED: "chancellor not voted",
  VETO_REQUESTED: "veto requested",
  VETO_ACCEPTED: "veto accepted",
  VETO_DENIED: "veto denied",
  LIBERAL_POLICY_PLACED: "liberal policy placed",
  FASCIST_POLICY_PLACED: "fascist policy placed",
  PLAYER_KILLED: "player killed",
  PRESIDENT_PEEK: "president peek",
  PRESIDENT_PICK: "president pick",
  CHANCELLOR_PICK: "chancellor pick",
  CHANCELLOR_VOTE: "chancellor vote",
  PRESIDENT_KILL: "president kill",
  PRESIDENT_INVESTIGATE: "president investigate",
  PRESIDENT_INVESTIGATED: "president investigated",
  END_GAME: "end game",
} as const;

export const GameEndEvent = {
  LIBERAL_WIN_HITLER: "liberal win hitler",
  LIBERAL_WIN_CARDS: "liberal win cards",
  FASCIST_WIN_HITLER: "fascist win hitler",
  FASCIST_WIN_CARDS: "fascist win cards"
} as const;

export type GameEndEvent = typeof GameEndEvent[keyof typeof GameEndEvent];

export const PlayerActions = {
  ...GameEvents,
  ...GameEndEvent,
  YOUR_PRESIDENT_DISCARD: "your president discard",
  YOUR_CHANCELLOR_DISCARD: "your chancellor discard",
  YOUR_CHANCELLOR_PICK: "your chancellor pick",
  YOUR_VETO_REQUESTED: "your veto requested",
  YOUR_PRESIDENT_PEEK: "your president peek",
  YOUR_PRESIDENT_PICK: "your president pick",
  YOUR_PRESIDENT_KILL: "your president kill",
  YOUR_PRESIDENT_INVESTIGATE: "your president investigate",
  YOUR_PRESIDENT_INVESTIGATED: "your president investigated"
} as const

export type GameEvent = typeof GameEvents[keyof typeof GameEvents];

export type PlayerAction = typeof PlayerActions[keyof typeof PlayerActions];