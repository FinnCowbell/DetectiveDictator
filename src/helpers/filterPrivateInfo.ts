import { Round } from "../model/GameState";
import { PID, Player } from "../model/Player";

// From all nested player objects (you, players, etc.), remove the membership field
export function filterPrivateInfo(rounds: Round[], yourPID?: PID): Round[] {

  const currentRound = rounds[rounds.length - 1];
  const currentState = currentRound.states[currentRound.states.length - 1];
  if (currentState.currentEvent === 'end game') {
    return rounds;
  }

  return rounds.map((round: Round) => {
    const {
      players,
      states,
      ...rest
    } = round;
    const newPlayers = Object.fromEntries(Object.values(players).map((player: Player) => {
      const {
        PID,
        ...rest
      } = player;
      return [PID, {
        ...rest,
        PID,
        membership: PID === yourPID ? 0 : -1,
      }]
    }));
    const newStates = states.map((state) => {
      const {
        you,
        ...rest
      } = state;
      return you === undefined ? state : {
        ...rest,
        you: {
          ...you,
          membership: yourPID === undefined ? 0 : -1,
        }
      }
    });
    return {
      ...rest,
      players: newPlayers,
      states: newStates,
    } as Round
  });
};