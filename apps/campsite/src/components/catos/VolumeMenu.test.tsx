import { describe, it, expect } from "vitest";

import { volumeLevel } from "./VolumeMenu";

describe("volumeLevel", () => {
  it("calls only true silence muted", () => {
    expect(volumeLevel(0)).toBe("muted");
    expect(volumeLevel(0.05)).toBe("quiet");
  });

  it("bands the rest of the range", () => {
    expect(volumeLevel(0.33)).toBe("quiet");
    expect(volumeLevel(0.5)).toBe("mid");
    expect(volumeLevel(1)).toBe("loud");
  });
});
