import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { MAZE } from "./maze";
import { maxScore } from "./scoring";

/** The leaderboard's ceiling, read from the Lambda that enforces it. Tests run from `apps/campsite`. */
function lambdaMaxScore(): number {
  const source = readFileSync(
    resolve(process.cwd(), "../../infra/lambda/pacmac-scores/accept.mjs"),
    "utf8",
  );
  const found = /export const MAX_SCORE = ([\d_]+);/.exec(source);
  if (!found) throw new Error("MAX_SCORE not found in the leaderboard Lambda");
  return Number(found[1].replace(/_/g, ""));
}

describe("maxScore", () => {
  it("adds every pellet, every ghost on every power pellet, and both fruit", () => {
    // 240 x 10, 4 x (50 + 200 + 400 + 800 + 1600), and two cats at 100.
    expect(maxScore(MAZE)).toBe(14_800);
  });

  it("is the ceiling the leaderboard enforces, so no honest game is refused", () => {
    expect(lambdaMaxScore()).toBe(maxScore(MAZE));
  });
});
