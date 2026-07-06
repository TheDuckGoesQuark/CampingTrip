import { describe, expect, it } from "vitest";

import { CLOSED, pathToState, stateToPath } from "./paths";

describe("pathToState", () => {
  it("maps the root to all-closed", () => {
    expect(pathToState("/")).toEqual(CLOSED);
  });

  it("maps /home to laptop open, no post", () => {
    expect(pathToState("/home")).toEqual({ ...CLOSED, laptop: true, postSlug: null });
  });

  it("maps /home/:slug to laptop open with that post", () => {
    expect(pathToState("/home/camping-trip")).toEqual({
      ...CLOSED,
      laptop: true,
      postSlug: "camping-trip",
    });
  });

  it("maps /notes and /music", () => {
    expect(pathToState("/notes")).toEqual({ ...CLOSED, notepad: true });
    expect(pathToState("/music")).toEqual({ ...CLOSED, music: true });
  });

  it("ignores trailing slashes and unknown paths", () => {
    expect(pathToState("/home/")).toEqual({ ...CLOSED, laptop: true, postSlug: null });
    expect(pathToState("/nonsense")).toEqual(CLOSED);
  });
});

describe("stateToPath", () => {
  it("round-trips each route", () => {
    for (const path of ["/", "/home", "/home/photobroom", "/notes", "/music"]) {
      expect(stateToPath(pathToState(path))).toBe(path);
    }
  });

  it("applies precedence notepad → music → laptop → scene", () => {
    expect(stateToPath({ laptop: true, notepad: true, music: true, postSlug: "x" })).toBe("/notes");
    expect(stateToPath({ laptop: true, notepad: false, music: true, postSlug: "x" })).toBe(
      "/music",
    );
    expect(stateToPath({ laptop: true, notepad: false, music: false, postSlug: "x" })).toBe(
      "/home/x",
    );
  });
});
