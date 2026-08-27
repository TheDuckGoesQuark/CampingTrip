import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMusicStore } from "../store/musicStore";
import { useSceneStore } from "../store/sceneStore";
import { applyOverlayState, closeOverlays, OVERLAY_LINKS } from "./overlays";
import { WINDOW_BROWSER } from "./windows";

vi.mock("../audio/musicPlayer", () => ({ musicPlayer: { stop: vi.fn() } }));

describe("applyOverlayState", () => {
  beforeEach(() => {
    useSceneStore.setState({
      laptopFocused: false,
      notepadFocused: false,
      openWindows: [],
      browserPath: null,
      openBlogPaths: [],
      focusTarget: "default",
    });
    useMusicStore.setState({ isOpen: false });
  });

  it("opens the laptop for the blog and carries the path from the URL", () => {
    applyOverlayState("laptop", "/blog/posts/what-vibe-coding-actually-changed.html");
    const s = useSceneStore.getState();
    expect(s.laptopFocused).toBe(true);
    expect(s.notepadFocused).toBe(false);
    expect(s.browserPath).toBe("/blog/posts/what-vibe-coding-actually-changed.html");
    expect(s.openWindows).toEqual([WINDOW_BROWSER]);
    expect(useMusicStore.getState().isOpen).toBe(false);
  });

  it("switching overlays closes the previous one (only one open at a time)", () => {
    applyOverlayState("laptop", "/blog/index.html");
    applyOverlayState("notepad");
    const s = useSceneStore.getState();
    expect(s.notepadFocused).toBe(true);
    expect(s.laptopFocused).toBe(false);
    expect(s.browserPath).toBeNull();
    expect(s.openWindows).toEqual([]);
  });

  it("gives the routed path a tab, so a deep link arrives with one open", () => {
    applyOverlayState("laptop", "/blog/index.html");
    expect(useSceneStore.getState().openBlogPaths).toEqual(["/blog/index.html"]);
  });

  it("keeps tabs already open when a second page is routed to", () => {
    applyOverlayState("laptop", "/blog/index.html");
    applyOverlayState("laptop", "/blog/tags/music.html");
    expect(useSceneStore.getState().openBlogPaths).toEqual([
      "/blog/index.html",
      "/blog/tags/music.html",
    ]);
  });

  it("re-routing to an open tab does not duplicate it", () => {
    applyOverlayState("laptop", "/blog/tags/music.html");
    applyOverlayState("laptop", "/blog/index.html");
    applyOverlayState("laptop", "/blog/tags/music.html");
    expect(useSceneStore.getState().openBlogPaths).toEqual([
      "/blog/tags/music.html",
      "/blog/index.html",
    ]);
  });

  it("bare /blog keeps the strip — the browser session outlasts one page", () => {
    applyOverlayState("laptop", "/blog/tags/music.html");
    applyOverlayState("laptop", null);
    expect(useSceneStore.getState().openBlogPaths).toEqual(["/blog/tags/music.html"]);
  });

  it("bare /blog closes every window, leaving the empty desktop", () => {
    applyOverlayState("laptop", "/blog/tags/music.html");
    applyOverlayState("laptop", "/blog/desk/notes-txt");
    applyOverlayState("laptop", null);
    expect(useSceneStore.getState().openWindows).toEqual([]);
  });

  describe("the window stack", () => {
    const NOTES = "/blog/desk/notes-txt";
    const BIN = "/blog/desk/bin";

    it("gives a desktop item a window of its own, not a browser tab", () => {
      applyOverlayState("laptop", NOTES);
      const s = useSceneStore.getState();
      expect(s.openWindows).toEqual([NOTES]);
      expect(s.openBlogPaths).toEqual([]);
      expect(s.browserPath).toBeNull();
    });

    it("keeps windows already open when another is routed to", () => {
      applyOverlayState("laptop", "/blog/index.html");
      applyOverlayState("laptop", NOTES);
      expect(useSceneStore.getState().openWindows).toEqual([WINDOW_BROWSER, NOTES]);
    });

    it("raises rather than duplicates a window already open", () => {
      applyOverlayState("laptop", "/blog/index.html");
      applyOverlayState("laptop", NOTES);
      applyOverlayState("laptop", "/blog/tags/music.html");
      // The browser moves to the front; it does not appear twice.
      expect(useSceneStore.getState().openWindows).toEqual([NOTES, WINDOW_BROWSER]);
    });

    it("keeps the browser's page as its own, unchanged by another window opening", () => {
      applyOverlayState("laptop", "/blog/tags/music.html");
      applyOverlayState("laptop", NOTES);
      expect(useSceneStore.getState().browserPath).toBe("/blog/tags/music.html");
    });

    it("orders the stack by when each window was last routed to", () => {
      applyOverlayState("laptop", NOTES);
      applyOverlayState("laptop", BIN);
      applyOverlayState("laptop", NOTES);
      expect(useSceneStore.getState().openWindows).toEqual([BIN, NOTES]);
    });
  });

  it("leaving the blog entirely discards the strip", () => {
    applyOverlayState("laptop", "/blog/tags/music.html");
    applyOverlayState("notepad");
    expect(useSceneStore.getState().openBlogPaths).toEqual([]);
  });

  it("opens the music player", () => {
    applyOverlayState("music");
    expect(useMusicStore.getState().isOpen).toBe(true);
  });

  it("closeOverlays closes everything and stops the audio", async () => {
    applyOverlayState("music");
    closeOverlays();
    const s = useSceneStore.getState();
    expect(s.laptopFocused).toBe(false);
    expect(s.notepadFocused).toBe(false);
    expect(useMusicStore.getState().isOpen).toBe(false);
    const { musicPlayer } = await import("../audio/musicPlayer");
    expect(musicPlayer.stop).toHaveBeenCalled();
  });
});

describe("OVERLAY_LINKS", () => {
  it("promotes the blog and the music to the tab bar, but not the notepad", () => {
    const promoted = OVERLAY_LINKS.filter((l) => l.inTabBar).map((l) => l.label);
    expect(promoted).toEqual(["Blog", "Music"]);
  });

  // Dropping it from the tab bar must not drop it from the shared link table —
  // the notepad object in the tent resolves its route through here.
  it("keeps the notepad openable by route and by its 3D object", () => {
    const notepad = OVERLAY_LINKS.find((l) => l.kind === "notepad");
    expect(notepad?.path).toBe("/notes");
    expect(notepad?.objectId).toBe("notepad");
  });

  it("every link points at a real overlay kind and a nested path", () => {
    for (const link of OVERLAY_LINKS) {
      expect(["laptop", "notepad", "music"]).toContain(link.kind);
      expect(link.path.startsWith("/")).toBe(true);
    }
  });
});
