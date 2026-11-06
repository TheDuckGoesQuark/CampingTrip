import { describe, expect, it } from "vitest";

import { SWIPE_MIN, swipeDir } from "./swipe";

describe("swipeDir", () => {
  it("reads a swipe by the axis it moved along most", () => {
    expect(swipeDir(40, -10)).toBe("right");
    expect(swipeDir(-40, 10)).toBe("left");
    expect(swipeDir(10, -40)).toBe("up");
    expect(swipeDir(-10, 40)).toBe("down");
  });

  it("ignores a movement too small to mean anything", () => {
    expect(swipeDir(SWIPE_MIN - 1, 0)).toBeNull();
  });
});
