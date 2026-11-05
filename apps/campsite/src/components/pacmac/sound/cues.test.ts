import { describe, expect, it } from "vitest";

import { countFood, indexOf, MAZE } from "../engine/maze";
import { DEATH_SPIN_TICKS } from "../engine/rules";
import { dealRound, type GameState, initialState, type Round } from "../engine/state";
import { cuesBetween, sirenLevel } from "./cues";

const playing = (round: Round = dealRound()): GameState => ({ phase: "playing", round });

const eat = (round: Round, x: number, y: number): Round => {
  const food = round.food.slice();
  food[indexOf(MAZE, x, y)] = "none";
  return { ...round, food };
};

describe("cuesBetween", () => {
  it("plays the jingle when a game starts", () => {
    const ready: GameState = { phase: "ready", round: dealRound(), ticksLeft: 10 };
    expect(cuesBetween(initialState(), ready)).toEqual([{ kind: "start" }]);
  });

  it("says one syllable per pellet, alternating, so a run of them says MackaMacka", () => {
    const start = dealRound();
    const one = eat(start, 12, 23);
    const two = eat(one, 11, 23);
    const first = cuesBetween(playing(start), playing(one));
    const second = cuesBetween(playing(one), playing(two));
    expect([first, second].map((cues) => cues[0])).toEqual([
      { kind: "bite", syllable: "ka" },
      { kind: "bite", syllable: "mac" },
    ]);
  });

  it("stays quiet on a tick that eats nothing", () => {
    expect(cuesBetween(playing(), playing())).toEqual([]);
  });

  it("marks an eaten ghost and an eaten fruit", () => {
    const round = dealRound();
    const before = playing({
      ...round,
      fright: { ticksLeft: 100, eaten: 0 },
      fruit: { name: "cat", ticksLeft: 50 },
    });
    const after = playing({
      ...round,
      fright: { ticksLeft: 99, eaten: 1 },
      fruit: null,
      score: 300,
    });
    expect(cuesBetween(before, after)).toEqual([{ kind: "ghostEaten" }, { kind: "fruit" }]);
  });

  it("does not cheer a fruit that went uneaten", () => {
    const round = dealRound();
    const before = playing({ ...round, fruit: { name: "cat", ticksLeft: 1 } });
    expect(cuesBetween(before, playing({ ...round, fruit: null }))).toEqual([]);
  });

  it("plays the death as the spin begins, not as he is caught", () => {
    const round = dealRound();
    const caught: GameState = { phase: "dying", round, ticksLeft: DEATH_SPIN_TICKS + 1 };
    const spinning: GameState = { phase: "dying", round, ticksLeft: DEATH_SPIN_TICKS };
    expect(cuesBetween(playing(), caught)).toEqual([]);
    expect(cuesBetween(caught, spinning)).toEqual([{ kind: "death" }]);
  });
});

describe("sirenLevel", () => {
  const all = countFood(MAZE.food, "pellet") + countFood(MAZE.food, "power");

  it("is silent outside play", () => {
    expect(sirenLevel(initialState(), all)).toBeNull();
    expect(sirenLevel({ phase: "paused", round: dealRound() }, all)).toBeNull();
  });

  it("rises from the bottom as the pellets go", () => {
    expect(sirenLevel(playing(), all)).toBe(0);
    const half = dealRound();
    let left = all / 2;
    const food = half.food.map((item) => (item !== "none" && left-- > 0 ? "none" : item));
    expect(sirenLevel(playing({ ...half, food }), all)).toBeCloseTo(0.5);
  });
});
