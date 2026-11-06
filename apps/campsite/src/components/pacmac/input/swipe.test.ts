import { describe, expect, it } from "vitest";

import { HUB_RADIUS, padDir, SWIPE_MIN, swipeDir } from "./swipe";

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

describe("padDir", () => {
  it("cuts the pad's area into four by an X through its centre", () => {
    expect(padDir(-120, 30)).toBe("left");
    expect(padDir(150, -60)).toBe("right");
    expect(padDir(20, -70)).toBe("up");
    expect(padDir(-40, 90)).toBe("down");
  });

  it("means nothing on the hub itself", () => {
    expect(padDir(HUB_RADIUS - 1, 0)).toBeNull();
  });
});
