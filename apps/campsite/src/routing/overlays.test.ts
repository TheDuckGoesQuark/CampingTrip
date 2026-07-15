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
  it("every link points at a real overlay kind and a nested path", () => {
    for (const link of OVERLAY_LINKS) {
      expect(["laptop", "notepad", "music"]).toContain(link.kind);
      expect(link.path.startsWith("/")).toBe(true);
    }
  });
});
