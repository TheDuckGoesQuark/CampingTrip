import { describe, expect, it } from "vitest";

import { DEAD_ZONE, dirOf } from "./joystick";

describe("dirOf", () => {
  it("reads the axis the knob leans along most", () => {
    expect(dirOf(0.9, 0.2)).toBe("right");
    expect(dirOf(-0.6, 0.5)).toBe("left");
    expect(dirOf(0.1, -0.8)).toBe("up");
    expect(dirOf(-0.3, 0.7)).toBe("down");
  });

  it("ignores a knob resting near the centre", () => {
    expect(dirOf(DEAD_ZONE * 0.9, 0)).toBeNull();
    expect(dirOf(0, 0)).toBeNull();
  });
});
