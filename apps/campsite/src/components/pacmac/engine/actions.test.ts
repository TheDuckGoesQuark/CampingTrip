import { describe, expect, it, vi } from "vitest";

import { actionsFor, actionsForPhase } from "./actions";
import { dealRound, type Phase } from "./state";

const keysOf = (phase: Phase) =>
  Object.keys(actionsForPhase(phase, () => {}))
    .filter((key) => key !== "phase")
    .sort();

describe("actionsFor", () => {
  it("offers each phase exactly its own actions", () => {
    expect(keysOf("attract")).toEqual(["start"]);
    expect(keysOf("ready")).toEqual(["hold", "move"]);
    expect(keysOf("playing")).toEqual(["hold", "move", "pause"]);
    expect(keysOf("paused")).toEqual(["resume"]);
    expect(keysOf("dying")).toEqual([]);
    expect(keysOf("levelCleared")).toEqual([]);
    expect(keysOf("won")).toEqual(["start"]);
    expect(keysOf("gameOver")).toEqual(["start"]);
  });

  it("dispatches what each action names", () => {
    const dispatch = vi.fn();
    const actions = actionsFor({ phase: "playing", round: dealRound() }, dispatch);
    actions.move("up");
    actions.hold("left");
    actions.pause();
    expect(dispatch.mock.calls).toEqual([
      [{ type: "move", dir: "up", until: "lapse" }],
      [{ type: "move", dir: "left", until: "taken" }],
      [{ type: "pause" }],
    ]);
  });

  it("tags the actions with their phase, so a caller can narrow by it", () => {
    const actions = actionsForPhase("attract" as Phase, () => {});
    expect(actions.phase).toBe("attract");
    if (actions.phase === "attract") expect(typeof actions.start).toBe("function");
  });
});
