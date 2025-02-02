import { GameState } from "./GameState";

const DEMO_STATE: GameState = {
  rounds: [
    {
      gameInfo: {
        order: [101, 102, 103, 104, 105, 106, 107],
        style: 1,
      },
      players: {
        // Testing Players, for now.
        101: { PID: 101, username: "Karl", membership: 1, alive: true, connected: true, isLeader: true },
        102: { PID: 102, username: "Joseph", membership: 0, alive: true, connected: true, isLeader: false },
        103: { PID: 103, username: "Adolf", membership: 2, alive: false, connected: true, isLeader: false },
        104: { PID: 104, username: "Franklin", membership: 0, alive: true, connected: true, isLeader: false },
        105: { PID: 105, username: "Paul", membership: 0, alive: true, connected: true, isLeader: false },
        106: { PID: 106, username: "Winston", membership: 0, alive: true, connected: true, isLeader: false },
        107: { PID: 107, username: "Chiang", membership: 0, alive: true, connected: true, isLeader: false },
      },
      states: [
        {
          currentEvent: "pre game",
          libBoard: 4,
          fasBoard: 3,
          marker: 2,
          presidentPID: 101,
          chancellorPID: 103,
          previousChanPID: undefined,
          previousPresPID: undefined,
          votes: undefined,
          nInDraw: 5,
          nInDiscard: 12,
          investigate: undefined,
          victim: undefined,
          you: {
            isLeader: true,
            PID: 101, username: "Karl", membership: 1, alive: true, connected: true, hand: {}
          },
        }
      ],
    },
  ],
  //UIInfo is for visual information that doesn't impact gameplay.
  uiInfo: {
    selectedPlayer: undefined,
    voteReceived: false,
    voted: {},
    disconnected: {},
  },
};

export default DEMO_STATE;