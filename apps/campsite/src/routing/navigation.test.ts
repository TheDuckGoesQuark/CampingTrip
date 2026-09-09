import { describe, expect, it, vi } from "vitest";

import {
  deepLinkSkipsIntro,
  isCoveringRoute,
  linkFor,
  overlayNavigation,
  requestOpen,
  routes,
} from "./navigation";

describe("routes", () => {
  it("exposes the static overlay paths", () => {
    expect(routes.tent).toBe("/");
    expect(routes.blog).toBe("/blog");
    expect(routes.music).toBe("/music");
    expect(routes.notes).toBe("/notes");
  });
});

describe("isCoveringRoute", () => {
  it("is true for the overlays that fill the viewport", () => {
    expect(isCoveringRoute("/blog")).toBe(true);
    expect(isCoveringRoute("/blog/cv.html")).toBe(true);
    expect(isCoveringRoute("/notes")).toBe(true);
  });

  it("is false where the tent is still the backdrop", () => {
    expect(isCoveringRoute("/")).toBe(false);
    expect(isCoveringRoute("/music")).toBe(false);
  });
});

describe("deepLinkSkipsIntro", () => {
  it("skips it where the tent shows through, so the backdrop is not blank", () => {
    expect(deepLinkSkipsIntro("/music")).toBe(true);
  });

  it("keeps it owed on a covering arrival, so leaving reveals the tent", () => {
    expect(deepLinkSkipsIntro("/blog/cv.html")).toBe(false);
    expect(deepLinkSkipsIntro("/notes")).toBe(false);
  });

  it("leaves the tent's own route to the intro itself", () => {
    expect(deepLinkSkipsIntro("/")).toBe(false);
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
