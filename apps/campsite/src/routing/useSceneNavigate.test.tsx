import { act, render } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { overlayFlight } from "./navigation";
import { linkFor } from "./navigation";
import { useSceneNavigate } from "./useSceneNavigate";

/** Flush React after anything that can navigate, so `path` is current. */
const flush = (fn: () => void) =>
  act(() => {
    fn();
  });

vi.mock("../audio/musicPlayer", () => ({ musicPlayer: { stop: vi.fn() } }));

let path = "";
let go: (link: ReturnType<typeof linkFor>) => void;

function Harness() {
  go = useSceneNavigate();
  path = useLocation().pathname;
  return null;
}

const mount = () => render(<Harness />, { wrapper: MemoryRouter });

describe("useSceneNavigate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.matchMedia = ((q: string) =>
      ({
        matches: false,
        media: q,
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the overlay immediately but holds the URL", () => {
    mount();
    flush(() => go(linkFor("laptop")));
    expect(path).toBe("/");
  });

  it("commits the URL when the flight reports landing, not on the deadline", () => {
    mount();
    flush(() => go(linkFor("laptop")));
    flush(() => vi.advanceTimersByTime(1000));
    expect(path).toBe("/");

    flush(() => overlayFlight.landed("laptop"));
    expect(path).toBe("/blog");
  });

  it("ignores a landing from a different object", () => {
    mount();
    flush(() => go(linkFor("laptop")));
    flush(() => overlayFlight.landed("notepad"));
    expect(path).toBe("/");
  });

  // The music player has no 3D flight to report, so its deadline is the wait.
  it("falls back to the deadline when nothing reports", () => {
    mount();
    flush(() => go(linkFor("music")));
    flush(() => vi.advanceTimersByTime(linkFor("music").commitByMs));
    expect(path).toBe("/music");
  });

  it("commits only once when a landing and the deadline both arrive", () => {
    mount();
    flush(() => go(linkFor("notepad")));
    flush(() => overlayFlight.landed("notepad"));
    expect(path).toBe("/notes");
    flush(() => vi.advanceTimersByTime(5000));
    expect(path).toBe("/notes");
  });

  it("abandons an interrupted flight rather than landing on its URL", () => {
    mount();
    flush(() => go(linkFor("laptop")));
    flush(() => go(linkFor("notepad")));

    // The laptop finishes its arc after the visitor has already left for the
    // notepad; honouring it would navigate somewhere they turned away from.
    flush(() => overlayFlight.landed("laptop"));
    expect(path).toBe("/");

    flush(() => overlayFlight.landed("notepad"));
    expect(path).toBe("/notes");
  });

  it("does not commit after unmount", () => {
    const view = mount();
    flush(() => go(linkFor("laptop")));
    view.unmount();
    flush(() => overlayFlight.landed("laptop"));
    flush(() => vi.advanceTimersByTime(5000));
    expect(path).toBe("/");
  });

  it("commits straight away under reduced motion", () => {
    window.matchMedia = ((q: string) =>
      ({
        matches: true,
        media: q,
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
    mount();
    flush(() => go(linkFor("laptop")));
    expect(path).toBe("/blog");
  });
});
