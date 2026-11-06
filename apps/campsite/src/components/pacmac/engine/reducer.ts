import {
  GHOST_NAMES,
  type Ghost,
  type GhostName,
  inHouse,
  isTunnel,
  type Quarry,
  roam,
  targetOf,
  touching,
} from "./ghosts";
import { moveMacMan } from "./macman";
import { indexOf, MAZE } from "./maze";
import { opposite, tileOf } from "./movement";
import {
  CAUGHT_TICKS,
  CLEARED_TICKS,
  DEATH_SPIN_TICKS,
  HUNT_SCHEDULE,
  POINTS,
  READY_AFTER_DEATH_TICKS,
  READY_TICKS,
  RELEASE_DOTS,
  RELEASE_IDLE_TICKS,
  SPEED,
  STALL,
} from "./rules";
import { type Action, dealRound, type GameState, respawn, type Round } from "./state";

/** Eats whatever is on MacMan's tile, and counts it towards the next ghost's release. */
function eat(round: Round): Round {
  const tile = tileOf(MAZE, round.macman);
  const index = indexOf(MAZE, tile.x, tile.y);
  const item = round.food[index];
  if (item === "none") return { ...round, house: { ...round.house, idle: round.house.idle + 1 } };
  const food = round.food.slice();
  food[index] = "none";
  return {
    ...round,
    food,
    score: round.score + POINTS[item],
    macman: { ...round.macman, stall: STALL[item] },
    house: { ...round.house, dots: round.house.dots + 1, idle: 0 },
  };
}

function moveMacManIn(round: Round): Round {
  const { macman } = round;
  if (macman.stall > 0) {
    return {
      ...round,
      macman: { ...macman, stall: macman.stall - 1 },
      house: { ...round.house, idle: round.house.idle + 1 },
    };
  }
  return eat({ ...round, macman: moveMacMan(MAZE, macman, SPEED.macman) });
}

const mapGhosts = (round: Round, change: (ghost: Ghost) => Ghost) =>
  Object.fromEntries(GHOST_NAMES.map((name) => [name, change(round.ghosts[name])])) as Record<
    GhostName,
    Ghost
  >;

/** Counts down the scatter-chase schedule; every change of plan turns the loose ghosts round. */
function advanceHunt(round: Round): Round {
  const { hunt } = round;
  if (hunt.ticksLeft > 1) return { ...round, hunt: { ...hunt, ticksLeft: hunt.ticksLeft - 1 } };
  const stage = hunt.stage + 1;
  return {
    ...round,
    hunt: {
      kind: stage % 2 === 0 ? "scatter" : "chase",
      stage,
      ticksLeft: HUNT_SCHEDULE[stage] ?? Infinity,
    },
    ghosts: mapGhosts(round, (ghost) =>
      ghost.mode === "active" ? { ...ghost, dir: opposite(ghost.dir) } : ghost,
    ),
  };
}

/** Lets the next ghost in line out, if it has waited long enough by either measure. */
function release(round: Round): Round {
  const next = (["pinky", "inky", "clyde"] as const).find(
    (name) => round.ghosts[name].mode === "house",
  );
  if (!next) return round;
  const dots = (round.house.afterDeath ? RELEASE_DOTS.afterDeath : RELEASE_DOTS.fresh)[next];
  if (round.house.dots < dots && round.house.idle < RELEASE_IDLE_TICKS) return round;
  return {
    ...round,
    ghosts: { ...round.ghosts, [next]: { ...round.ghosts[next], mode: "leaving" } },
    house: { ...round.house, idle: 0 },
  };
}

function moveGhosts(round: Round): Round {
  const quarry: Quarry = {
    tile: tileOf(MAZE, round.macman),
    dir: round.macman.dir,
    blinky: tileOf(MAZE, round.ghosts.blinky),
  };
  return {
    ...round,
    ghosts: mapGhosts(round, (ghost) => {
      if (ghost.mode !== "active") return inHouse(MAZE, ghost, SPEED.ghostInHouse);
      const speed = isTunnel(MAZE, ghost) ? SPEED.ghostInTunnel : SPEED.ghost;
      return roam(MAZE, ghost, speed, targetOf(ghost, round.hunt.kind, quarry, MAZE));
    }),
  };
}

const caught = (round: Round) =>
  GHOST_NAMES.some(
    (name) =>
      round.ghosts[name].mode === "active" && touching(MAZE, round.ghosts[name], round.macman),
  );

const cleared = (round: Round) => !round.food.some((item) => item !== "none");

/** One tick of play, and what it led to. */
function play(state: Extract<GameState, { phase: "playing" }>): GameState {
  let round: Round = { ...state.round, clock: state.round.clock + 1 };
  round = moveMacManIn(round);
  if (cleared(round)) return { phase: "levelCleared", round, ticksLeft: CLEARED_TICKS };
  if (caught(round)) return { phase: "dying", round, ticksLeft: CAUGHT_TICKS + DEATH_SPIN_TICKS };
  round = moveGhosts(release(advanceHunt(round)));
  if (caught(round)) return { phase: "dying", round, ticksLeft: CAUGHT_TICKS + DEATH_SPIN_TICKS };
  return { phase: "playing", round };
}

function newGame(): GameState {
  return { phase: "ready", round: dealRound(), ticksLeft: READY_TICKS };
}

/** After the spin: another life from the spawns, or the end. */
function afterDeath(round: Round): GameState {
  const lives = round.lives - 1;
  if (lives === 0) return { phase: "gameOver", round: { ...round, lives } };
  return {
    phase: "ready",
    round: respawn({ ...round, lives }, true),
    ticksLeft: READY_AFTER_DEATH_TICKS,
  };
}

/**
 * The whole game as one function of state and action. An action the phase does
 * not allow returns the state unchanged; `actionsFor` never offers one.
 */
export function reduce(state: GameState, action: Action): GameState {
  switch (state.phase) {
    case "attract":
    case "won":
    case "gameOver":
      return action.type === "start" ? newGame() : state;
    case "ready":
      if (action.type !== "tick") return state;
      return state.ticksLeft > 1
        ? { ...state, ticksLeft: state.ticksLeft - 1 }
        : { phase: "playing", round: state.round };
    case "playing":
      switch (action.type) {
        case "tick":
          return play(state);
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
    case "dying":
      if (action.type !== "tick") return state;
      return state.ticksLeft > 1
        ? { ...state, ticksLeft: state.ticksLeft - 1 }
        : afterDeath(state.round);
    case "levelCleared":
      if (action.type !== "tick") return state;
      return state.ticksLeft > 1
        ? { ...state, ticksLeft: state.ticksLeft - 1 }
        : { phase: "won", round: state.round };
  }
}
