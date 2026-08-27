import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMusicStore } from "../store/musicStore";
import { useSceneStore } from "../store/sceneStore";
import { applyOverlayState, closeOverlays, OVERLAY_LINKS } from "./overlays";

vi.mock("../audio/musicPlayer", () => ({ musicPlayer: { stop: vi.fn() } }));

describe("applyOverlayState", () => {
  beforeEach(() => {
    useSceneStore.setState({
      laptopFocused: false,
      notepadFocused: false,
      activeBlogPath: null,
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
    expect(s.activeBlogPath).toBe("/blog/posts/what-vibe-coding-actually-changed.html");
    expect(useMusicStore.getState().isOpen).toBe(false);
  });

  it("switching overlays closes the previous one (only one open at a time)", () => {
    applyOverlayState("laptop", "/blog/index.html");
    applyOverlayState("notepad");
    const s = useSceneStore.getState();
    expect(s.notepadFocused).toBe(true);
    expect(s.laptopFocused).toBe(false);
    expect(s.activeBlogPath).toBeNull();
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
