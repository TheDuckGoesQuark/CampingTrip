import { describe, expect, it, vi } from "vitest";

import { linkFor, overlayNavigation, requestOpen, routes } from "./navigation";

describe("routes", () => {
  it("exposes the static overlay paths", () => {
    expect(routes.tent).toBe("/");
    expect(routes.blog).toBe("/blog");
    expect(routes.music).toBe("/music");
    expect(routes.notes).toBe("/notes");
  });
});

describe("linkFor", () => {
  it("returns the link matching a kind", () => {
    expect(linkFor("laptop").path).toBe("/blog");
    expect(linkFor("music").path).toBe("/music");
    expect(linkFor("notepad").path).toBe("/notes");
  });
});

describe("overlayNavigation", () => {
  it("delivers requests to subscribers and stops after unsubscribe", () => {
    const seen = vi.fn();
    const unsubscribe = overlayNavigation.subscribe(seen);

    requestOpen.blog();
    expect(seen).toHaveBeenCalledWith(linkFor("laptop"));

    unsubscribe();
    requestOpen.music();
    expect(seen).toHaveBeenCalledTimes(1);
  });
});
