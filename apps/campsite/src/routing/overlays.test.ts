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
      activePostSlug: null,
      openPostSlugs: [],
      focusTarget: "default",
    });
    useMusicStore.setState({ isOpen: false });
  });

  it("opens the laptop for the blog and carries the slug from the URL", () => {
    applyOverlayState("laptop", "camping-trip");
    const s = useSceneStore.getState();
    expect(s.laptopFocused).toBe(true);
    expect(s.notepadFocused).toBe(false);
    expect(s.activePostSlug).toBe("camping-trip");
    expect(useMusicStore.getState().isOpen).toBe(false);
  });

  it("switching overlays closes the previous one (only one open at a time)", () => {
    applyOverlayState("laptop", "x");
    applyOverlayState("notepad");
    const s = useSceneStore.getState();
    expect(s.notepadFocused).toBe(true);
    expect(s.laptopFocused).toBe(false);
    expect(s.activePostSlug).toBeNull();
  });

  it("gives the routed slug a tab, so a deep link arrives with one open", () => {
    applyOverlayState("laptop", "camping-trip");
    expect(useSceneStore.getState().openPostSlugs).toEqual(["camping-trip"]);
  });

  it("keeps tabs already open when a second post is routed to", () => {
    applyOverlayState("laptop", "camping-trip");
    applyOverlayState("laptop", "catmap");
    expect(useSceneStore.getState().openPostSlugs).toEqual(["camping-trip", "catmap"]);
  });

  it("re-routing to an open tab does not duplicate it", () => {
    applyOverlayState("laptop", "catmap");
    applyOverlayState("laptop", "camping-trip");
    applyOverlayState("laptop", "catmap");
    expect(useSceneStore.getState().openPostSlugs).toEqual(["catmap", "camping-trip"]);
  });

  it("bare /blog keeps the strip — the desktop is CatOS's new-tab page", () => {
    applyOverlayState("laptop", "catmap");
    applyOverlayState("laptop", null);
    expect(useSceneStore.getState().openPostSlugs).toEqual(["catmap"]);
  });

  it("leaving the blog entirely discards the strip", () => {
    applyOverlayState("laptop", "catmap");
    applyOverlayState("notepad");
    expect(useSceneStore.getState().openPostSlugs).toEqual([]);
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
