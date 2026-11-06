import { describe, expect, it } from "vitest";

import { cellAt, indexOf, MAZE } from "./maze";
import { tileOf } from "./movement";
import { reduce } from "./reducer";
import {
  CAUGHT_TICKS,
  CLEARED_TICKS,
  DEATH_SPIN_TICKS,
  HUNT_SCHEDULE,
  READY_AFTER_DEATH_TICKS,
  READY_TICKS,
  RELEASE_IDLE_TICKS,
  SPEED,
} from "./rules";
import { type Action, dealRound, type GameState, initialState, type Round } from "./state";

const tick: Action = { type: "tick" };

function run(state: GameState, ticks: number, action: Action = tick): GameState {
  let next = state;
  for (let i = 0; i < ticks; i++) next = reduce(next, action);
  return next;
}

function playing(change: (round: Round) => Round = (round) => round): GameState {
  return { phase: "playing", round: change(dealRound()) };
}

const withMacMan = (macman: Partial<Round["macman"]>) => (round: Round) => ({
  ...round,
  macman: { ...round.macman, ...macman },
});

describe("reduce", () => {
  it("opens on the attract screen, where time does not pass", () => {
    const state = initialState();
    expect(state.phase).toBe("attract");
    expect(reduce(state, tick)).toBe(state);
  });

  it("starts with READY! and counts it down to play", () => {
    const ready = reduce(initialState(), { type: "start" });
    expect(ready).toMatchObject({ phase: "ready", ticksLeft: READY_TICKS });
    expect(run(ready, READY_TICKS - 1).phase).toBe("ready");
    expect(run(ready, READY_TICKS).phase).toBe("playing");
  });

  it("moves MacMan one tick's worth of distance per tick", () => {
    const next = reduce(playing(), tick);
    expect(next.round.macman.x).toBeCloseTo(MAZE.spawns.macman.x - SPEED.macman);
    expect(next.round.clock).toBe(1);
  });

  it("queues a direction asked for while playing", () => {
    const next = reduce(playing(), { type: "move", dir: "right" });
    expect(next.round.macman.queued).toBe("right");
  });

  it("eats a pellet for ten points and stops a tick to swallow it", () => {
    const state = playing(withMacMan({ x: 12.55 }));
    const next = reduce(state, tick);
    expect(next.round.food[indexOf(MAZE, 12, 23)]).toBe("none");
    expect(next.round.score).toBe(10);
    const { x } = next.round.macman;
    expect(reduce(next, tick).round.macman.x).toBe(x);
  });

  it("eats a power pellet for fifty", () => {
    const state = playing(withMacMan({ x: 1, y: 3.6, dir: "up" }));
    const next = run(state, 6);
    expect(next.round.food[indexOf(MAZE, 1, 3)]).toBe("none");
    expect(next.round.score).toBe(50);
  });

  it("freezes everything while paused", () => {
    const paused = reduce(playing(), { type: "pause" });
    expect(paused.phase).toBe("paused");
    expect(run(paused, 30)).toBe(paused);
    expect(reduce(paused, { type: "resume" }).phase).toBe("playing");
  });

  it("ignores an action the phase does not allow", () => {
    const state = playing();
    expect(reduce(state, { type: "start" })).toBe(state);
    const attract = initialState();
    expect(reduce(attract, { type: "move", dir: "up" })).toBe(attract);
  });
});

const withGhost =
  (name: "blinky" | "pinky" | "inky" | "clyde", ghost: Partial<Round["ghosts"]["blinky"]>) =>
  (round: Round) => ({
    ...round,
    ghosts: { ...round.ghosts, [name]: { ...round.ghosts[name], ...ghost } },
  });

const DEATH = CAUGHT_TICKS + DEATH_SPIN_TICKS;

describe("the ghosts", () => {
  it("let Pinky out at once and keep Inky in until thirty pellets are eaten", () => {
    const next = reduce(playing(), tick);
    expect(next.round.ghosts.pinky.mode).toBe("leaving");
    expect(next.round.ghosts.inky.mode).toBe("house");
    const fed = playing((round) => ({ ...round, house: { ...round.house, dots: 30 } }));
    const released = reduce(reduce(fed, tick), tick);
    expect(released.round.ghosts.inky.mode).toBe("leaving");
  });

  it("let the next ghost out when MacMan stops eating for four seconds", () => {
    const idle = playing((round) => ({
      ...round,
      ghosts: { ...round.ghosts, pinky: { ...round.ghosts.pinky, mode: "active" } },
      house: { ...round.house, idle: RELEASE_IDLE_TICKS },
    }));
    expect(reduce(idle, tick).round.ghosts.inky.mode).toBe("leaving");
  });

  it("scatter first, then chase, turning round when the plan changes", () => {
    const before = run(playing(), HUNT_SCHEDULE[0] - 1);
    expect(before.round.hunt.kind).toBe("scatter");
    const after = reduce(before, tick);
    expect(after.round.hunt.kind).toBe("chase");
    expect(after.round.ghosts.blinky.dir).not.toBe(before.round.ghosts.blinky.dir);
  });

  it("catch MacMan when one reaches him, and everything stops", () => {
    const state = playing(withGhost("blinky", { x: 13, y: 23, dir: "right" }));
    const caught = reduce(state, tick);
    expect(caught).toMatchObject({ phase: "dying", ticksLeft: DEATH });
    expect(reduce(caught, { type: "move", dir: "up" })).toBe(caught);
  });

  it("ignore MacMan while they are still in the house", () => {
    const state = playing(withGhost("pinky", { x: 13.5, y: 23, mode: "house" }));
    expect(reduce(state, tick).phase).toBe("playing");
  });
});

describe("lives", () => {
  const caught = (lives: number) =>
    reduce(
      playing((round) => withGhost("blinky", { x: 13, y: 23 })({ ...round, lives })),
      tick,
    );

  it("start at three", () => {
    expect(initialState().round.lives).toBe(3);
  });

  it("go down by one after the death, and play resumes from the spawns", () => {
    const after = run(caught(3), DEATH);
    expect(after).toMatchObject({ phase: "ready", ticksLeft: READY_AFTER_DEATH_TICKS });
    expect(after.round.lives).toBe(2);
    expect(after.round.macman).toMatchObject(MAZE.spawns.macman);
    expect(after.round.house.afterDeath).toBe(true);
  });

  it("keep the pellets already eaten across a death", () => {
    const eaten = caught(3).round.food;
    expect(run(caught(3), DEATH).round.food).toEqual(eaten);
  });

  it("end the game when the last is lost, and Space starts afresh", () => {
    const over = run(caught(1), DEATH);
    expect(over.phase).toBe("gameOver");
    expect(over.round.lives).toBe(0);
    const again = reduce(over, { type: "start" });
    expect(again).toMatchObject({ phase: "ready", ticksLeft: READY_TICKS });
    expect(again.round.lives).toBe(3);
    expect(again.round.score).toBe(0);
  });
});

describe("clearing the board", () => {
  it("flashes the walls, then shows the win screen", () => {
    const last = indexOf(MAZE, 12, 23);
    const almost = playing((round) => ({
      ...round,
      food: round.food.map((_, i) => (i === last ? "pellet" : "none")),
      macman: { ...round.macman, x: 12.55 },
    }));
    const cleared = reduce(almost, tick);
    expect(cleared).toMatchObject({ phase: "levelCleared", ticksLeft: CLEARED_TICKS });
    const won = run(cleared, CLEARED_TICKS);
    expect(won.phase).toBe("won");
    expect(won.round.score).toBe(10);
    expect(reduce(won, { type: "start" }).phase).toBe("ready");
  });
});

describe("a long game", () => {
  it("never puts MacMan or a loose ghost inside a wall", () => {
    const dirs = ["up", "left", "down", "right"] as const;
    let state: GameState = reduce(initialState(), { type: "start" });
    for (let t = 0; t < 20_000; t++) {
      if (state.phase === "gameOver" || state.phase === "won")
        state = reduce(state, { type: "start" });
      if (state.phase === "playing" && t % 45 === 0) {
        state = reduce(state, { type: "move", dir: dirs[(t * 7) % 4] });
      }
      state = reduce(state, tick);
      const { round } = state;
      const walls = [
        round.macman,
        ...Object.values(round.ghosts).filter((g) => g.mode === "active"),
      ]
        .map((mover) => tileOf(MAZE, mover))
        .filter((tile) => !["floor", "tunnel"].includes(cellAt(MAZE, tile.x, tile.y)));
      expect(walls, `tick ${t}`).toEqual([]);
    }
  });
});
