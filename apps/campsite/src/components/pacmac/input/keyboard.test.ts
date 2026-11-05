import { describe, expect, it } from "vitest";

import { commandFor } from "./keyboard";

describe("commandFor", () => {
  it("reads the arrows and W, A, S and D as directions, in either case", () => {
    expect(commandFor("ArrowLeft")).toEqual({ kind: "move", dir: "left" });
    expect(commandFor("w")).toEqual({ kind: "move", dir: "up" });
    expect(commandFor("D")).toEqual({ kind: "move", dir: "right" });
  });

  it("reads Space as the one button, and P or Escape as pause", () => {
    expect(commandFor(" ")).toEqual({ kind: "primary" });
    expect(commandFor("p")).toEqual({ kind: "pause" });
    expect(commandFor("Escape")).toEqual({ kind: "pause" });
  });

  it("leaves every other key to the page", () => {
    expect(commandFor("Tab")).toBeNull();
    expect(commandFor("q")).toBeNull();
  });
});
