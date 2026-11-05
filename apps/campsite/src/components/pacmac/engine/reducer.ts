import { FRUIT_AT_DOTS, fruitFor } from "./fruit";
import {
  atDoorstep,
  DOOR_TARGET,
  GHOST_NAMES,
  type Ghost,
  type GhostName,
  inHouse,
  isTunnel,
  type Quarry,
  roam,
  type Steering,
  targetOf,
  touching,
} from "./ghosts";
import { moveMacMan } from "./macman";
import { countFood, type Dir, indexOf, MAZE } from "./maze";
import { opposite, tileOf } from "./movement";
import { nextRandom } from "./random";
import {
  CAUGHT_TICKS,
  CLEARED_TICKS,
  DEATH_SPIN_TICKS,
  FRIGHT_TICKS,
  FRUIT_TICKS,
  GHOST_EATEN_TICKS,
  GHOST_POINTS,
  HUNT_SCHEDULE,
  POINTS,
  POPUP_TICKS,
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
  const fed: Round = {
    ...round,
    food,
    score: round.score + POINTS[item],
    macman: { ...round.macman, stall: STALL[item] },
    house: { ...round.house, dots: round.house.dots + 1, idle: 0 },
  };
  return item === "power" ? frighten(fed) : fed;
}

/** Every ghost not already eaten turns blue, and the loose ones turn round. */
function frighten(round: Round): Round {
  return {
    ...round,
    fright: { ticksLeft: FRIGHT_TICKS, eaten: 0 },
    ghosts: mapGhosts(round, (ghost) => {
      if (ghost.mode === "eyes" || ghost.mode === "entering") return ghost;
      const dir = ghost.mode === "active" ? opposite(ghost.dir) : ghost.dir;
      return { ...ghost, scared: true, dir };
    }),
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
  const speed = round.fright ? SPEED.macmanPowered : SPEED.macman;
  return eat({ ...round, macman: moveMacMan(MAZE, macman, speed) });
}

const mapGhosts = (round: Round, change: (ghost: Ghost) => Ghost) =>
  Object.fromEntries(GHOST_NAMES.map((name) => [name, change(round.ghosts[name])])) as Record<
    GhostName,
    Ghost
  >;

/**
 * Counts down the scatter-chase schedule, which stands still while the ghosts
 * are frightened. Every change of plan turns the loose ghosts round.
 */
function advanceHunt(round: Round): Round {
  const { hunt } = round;
  if (round.fright) return round;
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

function moveGhost(round: Round, ghost: Ghost, quarry: Quarry, roll: number): Ghost {
  switch (ghost.mode) {
    case "house":
    case "leaving":
    case "entering":
      return inHouse(MAZE, ghost, SPEED.ghostInHouse);
    case "eyes": {
      const moved = roam(MAZE, ghost, SPEED.eyes, { target: DOOR_TARGET });
      return atDoorstep(MAZE, moved)
        ? { ...moved, ...MAZE.spawns.blinky, mode: "entering" }
        : moved;
    }
    case "active": {
      const steering: Steering = ghost.scared
        ? { roll }
        : { target: targetOf(ghost, round.hunt.kind, quarry, MAZE) };
      const speed = isTunnel(MAZE, ghost)
        ? SPEED.ghostInTunnel
        : ghost.scared
          ? SPEED.ghostFrightened
          : SPEED.ghost;
      return roam(MAZE, ghost, speed, steering);
    }
  }
}

function moveGhosts(round: Round): Round {
  const quarry: Quarry = {
    tile: tileOf(MAZE, round.macman),
    dir: round.macman.dir,
    blinky: tileOf(MAZE, round.ghosts.blinky),
  };
  let { seed } = round;
  const ghosts = mapGhosts(round, (ghost) => {
    const [roll, next] = nextRandom(seed);
    seed = next;
    return moveGhost(round, ghost, quarry, roll);
  });
  return { ...round, ghosts, seed };
}

/** The power pellet's clock; when it runs out, every ghost still blue is dangerous again. */
function advanceFright(round: Round): Round {
  if (!round.fright) return round;
  if (round.fright.ticksLeft > 1) {
    return { ...round, fright: { ...round.fright, ticksLeft: round.fright.ticksLeft - 1 } };
  }
  return {
    ...round,
    fright: null,
    ghosts: mapGhosts(round, (ghost) => ({ ...ghost, scared: false })),
  };
}

type Meeting = "none" | "caught" | "ate";

/**
 * Settles every ghost MacMan is touching: a blue one is eaten, for double the
 * last one's points, and turns to eyes; any other loose one catches him.
 */
function meet(round: Round): [Round, Meeting] {
  let result: Meeting = "none";
  let next = round;
  for (const name of GHOST_NAMES) {
    const ghost = next.ghosts[name];
    if (ghost.mode !== "active" || !touching(MAZE, ghost, next.macman)) continue;
    if (!ghost.scared || !next.fright) return [next, "caught"];
    const { eaten } = next.fright;
    const points = GHOST_POINTS[Math.min(eaten, GHOST_POINTS.length - 1)];
    next = {
      ...next,
      score: next.score + points,
      fright: { ...next.fright, eaten: eaten + 1 },
      ghosts: { ...next.ghosts, [name]: { ...ghost, mode: "eyes", scared: false } },
      popups: [...next.popups, { x: ghost.x, y: ghost.y, points, ticksLeft: GHOST_EATEN_TICKS }],
      freeze: GHOST_EATEN_TICKS,
    };
    result = "ate";
  }
  return [next, result];
}

const BOARD_FOOD = countFood(MAZE.food, "pellet") + countFood(MAZE.food, "power");

/** Puts out the next fruit when enough has been eaten, times it out, or lets MacMan eat it. */
function tendFruit(round: Round): Round {
  const eaten = BOARD_FOOD - countFood(round.food, "pellet") - countFood(round.food, "power");
  let next = round;
  const due = FRUIT_AT_DOTS[next.fruitsShown];
  if (!next.fruit && due !== undefined && eaten >= due) {
    next = {
      ...next,
      fruit: { name: fruitFor(next.fruitsShown).name, ticksLeft: FRUIT_TICKS },
      fruitsShown: next.fruitsShown + 1,
    };
  }
  if (!next.fruit) return next;
  const spot = MAZE.spawns.fruit;
  if (touching(MAZE, spot, next.macman)) {
    const { points } = fruitFor(next.fruitsShown - 1);
    return {
      ...next,
      fruit: null,
      score: next.score + points,
      popups: [...next.popups, { ...spot, points, ticksLeft: POPUP_TICKS }],
    };
  }
  return next.fruit.ticksLeft > 1
    ? { ...next, fruit: { ...next.fruit, ticksLeft: next.fruit.ticksLeft - 1 } }
    : { ...next, fruit: null };
}

const agePopups = (round: Round): Round => ({
  ...round,
  popups: round.popups
    .map((popup) => ({ ...popup, ticksLeft: popup.ticksLeft - 1 }))
    .filter((popup) => popup.ticksLeft > 0),
});

const cleared = (round: Round) => !round.food.some((item) => item !== "none");

const dying = (round: Round): GameState => ({
  phase: "dying",
  round: { ...round, fruit: null, popups: [] },
  ticksLeft: CAUGHT_TICKS + DEATH_SPIN_TICKS,
});

/** One tick of play, and what it led to. */
function play(state: Extract<GameState, { phase: "playing" }>): GameState {
  const held = state.round;
  // An eaten ghost's points hold the board still; only the popups age.
  if (held.freeze > 0) {
    return { phase: "playing", round: agePopups({ ...held, freeze: held.freeze - 1 }) };
  }
  let round: Round = { ...held, clock: held.clock + 1 };
  round = moveMacManIn(round);
  if (cleared(round)) return { phase: "levelCleared", round, ticksLeft: CLEARED_TICKS };

  let met: Meeting;
  [round, met] = meet(round);
  if (met === "caught") return dying(round);
  if (met === "ate") return { phase: "playing", round };

  round = moveGhosts(release(advanceHunt(advanceFright(round))));
  [round, met] = meet(round);
  if (met === "caught") return dying(round);
  return { phase: "playing", round: met === "ate" ? round : agePopups(tendFruit(round)) };
}

/** Holds a direction for MacMan to take at the next chance, starting `QUEUE_HOLD` from here. */
function queue(round: Round, dir: Dir): Round {
  return { ...round, macman: { ...round.macman, queued: dir, queuedAt: round.macman.travelled } };
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
      // A direction pressed while READY! shows is the first one he takes.
      if (action.type === "move") return { ...state, round: queue(state.round, action.dir) };
      if (action.type !== "tick") return state;
      return state.ticksLeft > 1
        ? { ...state, ticksLeft: state.ticksLeft - 1 }
        : { phase: "playing", round: state.round };
    case "playing":
      switch (action.type) {
        case "tick":
          return play(state);
        case "move":
          return { ...state, round: queue(state.round, action.dir) };
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
