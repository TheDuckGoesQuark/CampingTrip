import { moveMacMan } from "./macman";
import { indexOf, MAZE } from "./maze";
import { tileOf } from "./movement";
import { POINTS, READY_TICKS, SPEED, STALL } from "./rules";
import { type Action, dealRound, type GameState, type Round } from "./state";

/** Eats whatever is on MacMan's tile. */
function eat(round: Round): Round {
  const tile = tileOf(MAZE, round.macman);
  const index = indexOf(MAZE, tile.x, tile.y);
  const item = round.food[index];
  if (item === "none") return round;
  const food = round.food.slice();
  food[index] = "none";
  return {
    ...round,
    food,
    score: round.score + POINTS[item],
    macman: { ...round.macman, stall: STALL[item] },
  };
}

function play(round: Round): Round {
  const clock = round.clock + 1;
  const { macman } = round;
  if (macman.stall > 0) return { ...round, clock, macman: { ...macman, stall: macman.stall - 1 } };
  return eat({ ...round, clock, macman: moveMacMan(MAZE, macman, SPEED.macman) });
}

/**
 * The whole game as one function of state and action. An action the phase does
 * not allow returns the state unchanged; `actionsFor` never offers one.
 */
export function reduce(state: GameState, action: Action): GameState {
  switch (state.phase) {
    case "attract":
      return action.type === "start"
        ? { phase: "ready", round: dealRound(), ticksLeft: READY_TICKS }
        : state;
    case "ready":
      if (action.type !== "tick") return state;
      return state.ticksLeft > 1
        ? { ...state, ticksLeft: state.ticksLeft - 1 }
        : { phase: "playing", round: state.round };
    case "playing":
      switch (action.type) {
        case "tick":
          return { ...state, round: play(state.round) };
        case "move":
          return {
            ...state,
            round: { ...state.round, macman: { ...state.round.macman, queued: action.dir } },
          };
        case "pause":
          return { phase: "paused", round: state.round };
        default:
          return state;
      }
    case "paused":
      return action.type === "resume" ? { phase: "playing", round: state.round } : state;
  }
}
