import { musicPlayer } from "../audio/musicPlayer";
import { useMusicStore } from "../store/musicStore";
import { useSceneStore } from "../store/sceneStore";

/** Which overlay a route opens. Exactly one is open at a time. */
export type OverlayKind = "laptop" | "notepad" | "music";

export interface OverlayLink {
  /** URL that opens this overlay — the tab links here and deep links land here. */
  path: string;
  /** Tab-bar text (and the tab's accessible name). */
  label: string;
  /** interactionStore id of the 3D object this belongs to — glows on tab hover/focus. */
  objectId: string;
  /** The overlay this route opens. */
  kind: OverlayKind;
  /**
   * Latest an in-app click may hold the URL, in ms. Normally unused — the URL
   * commits when the object's flight reports landing. It carries the wait only
   * for an overlay with no flight to report (the music player), so for the
   * animated ones it must sit clear of the real animation rather than match it.
   */
  commitByMs: number;
}

/**
 * The three openable places, shared by the tab bar and the 3D-object
 * activations so both drive the exact same navigation.
 */
export const OVERLAY_LINKS: OverlayLink[] = [
  // Laptop and notepad fly for 1.0s and 0.9s; the music player does not move,
  // so its deadline is the whole wait rather than a fallback.
  { path: "/blog", label: "Blog", objectId: "laptop", kind: "laptop", commitByMs: 1600 },
  { path: "/music", label: "Music", objectId: "shure-mic", kind: "music", commitByMs: 250 },
  { path: "/notes", label: "Notes", objectId: "notepad", kind: "notepad", commitByMs: 1500 },
];

/**
 * Declare the scene's complete overlay state. Opens `kind` and closes the rest,
 * so it fully describes "what a route means". Idempotent — routes call it on
 * mount (URL is the source of truth), and an in-app click calls it once up front
 * to start the open animation before the URL commits. `null` closes everything.
 *
 * All overlays keep the default camera framing: the laptop/notepad "open" look is
 * driven by their own model/overlay animation, not a camera preset.
 */
export function applyOverlayState(kind: OverlayKind | null, slug: string | null = null): void {
  const scene = useSceneStore.getState();
  const music = useMusicStore.getState();

  scene.setLaptopFocused(kind === "laptop");
  scene.setNotepadFocused(kind === "notepad");
  scene.setActivePostSlug(kind === "laptop" ? slug : null);
  scene.setFocusTarget("default");

  // The browser session lasts as long as the visitor is inside CatOS, so bare
  // /blog keeps the strip — it is the desktop, which is CatOS's new-tab page.
  // Only leaving the laptop ends it; the window's close control clears explicitly.
  if (kind !== "laptop") {
    scene.closeAllPosts();
  } else if (slug) {
    scene.openPost(slug);
  }

  if (kind === "music") {
    music.open();
  } else if (music.isOpen) {
    music.close();
    musicPlayer.stop();
  }
}

/** Canonical "nothing open" state, used by the index route and every close path. */
export function closeOverlays(): void {
  applyOverlayState(null);
}
