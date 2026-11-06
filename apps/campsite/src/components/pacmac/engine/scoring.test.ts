import { describe, expect, it } from "vitest";

import { MAZE } from "./maze";
import { maxScore } from "./scoring";

describe("maxScore", () => {
  it("adds every pellet, every ghost on every power pellet, and both fruit", () => {
    // 240 x 10, 4 x (50 + 200 + 400 + 800 + 1600), and two cats at 100.
    expect(maxScore(MAZE)).toBe(14_800);
  });
});
