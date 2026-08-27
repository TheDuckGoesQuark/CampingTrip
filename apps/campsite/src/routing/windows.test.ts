import { describe, expect, it } from "vitest";

import { blogPaths } from "./blogPaths";
import {
  frontWindow,
  isBrowserWindow,
  pathForWindow,
  windowIdFor,
  WINDOW_BROWSER,
} from "./windows";

describe("windowIdFor", () => {
  it("puts every browser page in the one browser window", () => {
    for (const path of [blogPaths.home, blogPaths.archive, blogPaths.tag("music")]) {
      expect(windowIdFor(path)).toBe(WINDOW_BROWSER);
    }
  });

  it("gives a desktop item a window identified by its own path", () => {
    const path = blogPaths.desk("notes-txt");
    expect(windowIdFor(path)).toBe(path);
  });
});

describe("isBrowserWindow", () => {
  it("separates the browser from a desktop item", () => {
    expect(isBrowserWindow(WINDOW_BROWSER)).toBe(true);
    expect(isBrowserWindow(blogPaths.desk("bin"))).toBe(false);
  });
});

describe("pathForWindow", () => {
  it("gives the browser whatever page it currently holds", () => {
    expect(pathForWindow(WINDOW_BROWSER, blogPaths.tag("music"))).toBe(blogPaths.tag("music"));
  });

  it("gives nothing for a browser holding no page, so nothing navigates", () => {
    expect(pathForWindow(WINDOW_BROWSER, null)).toBeNull();
  });

  it("gives a desktop item its own id back", () => {
    const path = blogPaths.desk("notes-txt");
    expect(pathForWindow(path, null)).toBe(path);
  });

  it("gives nothing for an id that is not a blog path at all", () => {
    expect(pathForWindow("nonsense", null)).toBeNull();
  });
});

describe("frontWindow", () => {
  it("is the last, since the stack renders back to front", () => {
    expect(frontWindow(["a", "b", "c"])).toBe("c");
  });

  it("is undefined for an empty desktop", () => {
    expect(frontWindow([])).toBeUndefined();
  });
});
