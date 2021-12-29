let defaultState = {
  rounds: [
    {
      gameInfo: {
        order: [101, 102, 103, 104, 105, 106, 107],
        style: 1,
      },
      players: {
        // Testing Players, for now.
        101: { PID: 101, username: "Karl", membership: 1, alive: true },
        102: { PID: 102, username: "Joseph", membership: 0, alive: true },
        103: { PID: 103, username: "Adolf", membership: 2, alive: false },
        104: { PID: 104, username: "Franklin", membership: 0, alive: true },
        105: { PID: 105, username: "Paul", membership: 0, alive: true },
        106: { PID: 106, username: "Winston", membership: 0, alive: true },
        107: { PID: 107, username: "Chiang", membership: 0, alive: true },
      },
      states: [
        {
          currentEvent: "pre game",
          LibBoard: 4,
          FasBoard: 3,
          marker: 2,
          presidentPID: 101,
          chancellorPID: 103,
          previousPresidentPID: null,
          previousChancellorPID: null,
          votes: null,
          nInDiscard: null,
          nInDraw: 5,
          nInDiscard: 12,
          investigate: null,
          victim: null,
        },
      ],
    },
  ],
  //UIInfo is for visual information that doesn't impact gameplay.
  uiInfo: {
    selectedPlayer: null,
    voteReceived: false,
    voted: {},
    disconnected: {},
  },
};
export default defaultState;
