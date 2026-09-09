import { act, render } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMusicStore } from "../store/musicStore";
import { laptopUp, notepadUp, useSceneStore } from "../store/sceneStore";
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

  it("holds the URL until the flight has had time to play", () => {
    mount();
    flush(() => go(linkFor("music")));
    expect(path).toBe("/");
    flush(() => vi.advanceTimersByTime(linkFor("music").animMs));
    expect(path).toBe("/music");
  });

  it("opens an overlay that leaves the tent visible straight away", () => {
    mount();
    flush(() => go(linkFor("music")));
    expect(useMusicStore.getState().isOpen).toBe(true);
    expect(useSceneStore.getState().flyingTo).toBeNull();
  });

  it("flies the object first for an overlay that would cover it", () => {
    mount();
    flush(() => go(linkFor("laptop")));

    // Mid-flight: the tent is still on screen and the laptop is on its way.
    expect(useSceneStore.getState().flyingTo).toBe("laptop");
    expect(useSceneStore.getState().laptopFocused).toBe(false);
    expect(path).toBe("/");

    flush(() => vi.advanceTimersByTime(linkFor("laptop").animMs));
    expect(path).toBe(blogPaths.home);
  });

  it("puts a flying object in its focus pose before it has landed", () => {
    mount();
    flush(() => go(linkFor("laptop")));
    expect(laptopUp(useSceneStore.getState())).toBe(true);
    expect(notepadUp(useSceneStore.getState())).toBe(false);
  });

  it("abandons a superseded flight rather than landing on its URL", () => {
    mount();
    flush(() => go(linkFor("laptop")));
    flush(() => go(linkFor("music")));
    flush(() => vi.advanceTimersByTime(5000));

    // The laptop's hold must not fire after the visitor turned to the music.
    expect(path).toBe("/music");
    expect(useSceneStore.getState().flyingTo).toBeNull();
  });

  it("does not commit after unmount", () => {
    const view = mount();
    flush(() => go(linkFor("music")));
    view.unmount();
    flush(() => vi.advanceTimersByTime(5000));
    expect(path).toBe("/");
  });

  it("puts a flying object back rather than stranding it in the visitor's face", () => {
    const view = mount();
    flush(() => go(linkFor("laptop")));
    expect(useSceneStore.getState().flyingTo).toBe("laptop");

    view.unmount();
    expect(useSceneStore.getState().flyingTo).toBeNull();
  });

  it("skips the flight and commits straight away under reduced motion", () => {
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
    expect(useSceneStore.getState().flyingTo).toBeNull();
  });
});
