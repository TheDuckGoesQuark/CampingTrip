import { describe, expect, it } from "vitest";

import { indexOf, MAZE } from "./maze";
import { reduce } from "./reducer";
import { READY_TICKS, SPEED } from "./rules";
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
