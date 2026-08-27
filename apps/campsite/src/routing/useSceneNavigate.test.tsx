import { act, render } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { blogPaths } from "./blogPaths";
import { linkFor } from "./navigation";
import { useSceneNavigate } from "./useSceneNavigate";

vi.mock("../audio/musicPlayer", () => ({ musicPlayer: { stop: vi.fn() } }));

let path = "";
let go: (link: ReturnType<typeof linkFor>) => void;

function Harness() {
  go = useSceneNavigate();
  path = useLocation().pathname;
  return null;
}

const mount = () => render(<Harness />, { wrapper: MemoryRouter });
/** Flush React after anything that can navigate, so `path` is current. */
const flush = (fn: () => void) =>
  act(() => {
    fn();
  });

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

  it("commits the URL once the hold elapses", () => {
    mount();
    flush(() => go(linkFor("laptop")));
    flush(() => vi.advanceTimersByTime(linkFor("laptop").animMs));
    expect(path).toBe(blogPaths.home);
  });

  it("abandons a superseded flight rather than landing on its URL", () => {
    mount();
    flush(() => go(linkFor("laptop")));
    flush(() => go(linkFor("notepad")));
    flush(() => vi.advanceTimersByTime(5000));

    // The laptop's hold must not fire after the visitor turned to the notepad.
    expect(path).toBe("/notes");
  });

  it("does not commit after unmount", () => {
    const view = mount();
    flush(() => go(linkFor("laptop")));
    view.unmount();
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
    expect(path).toBe(blogPaths.home);
  });
});
