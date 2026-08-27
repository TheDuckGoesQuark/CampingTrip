import { musicPlayer } from "../audio/musicPlayer";
import { useMusicStore } from "../store/musicStore";
import { useSceneStore } from "../store/sceneStore";
import { isBrowserPath } from "./blogPaths";

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
  /** How long an in-app click holds the URL, in ms — roughly the open animation. */
  animMs: number;
  /**
   * Whether the tab bar promotes this place. The notepad is still openable — by
   * its object in the tent, and by its URL — it just isn't worth a permanent
   * shortcut alongside the blog and the music.
   */
  inTabBar: boolean;
}

/**
 * The openable places, shared by the tab bar and the 3D-object activations so
 * both drive the exact same navigation. Not every place is promoted to the tab
 * bar — see `inTabBar`.
 */
export const OVERLAY_LINKS: OverlayLink[] = [
  { path: "/blog", label: "Blog", objectId: "laptop", kind: "laptop", animMs: 900, inTabBar: true },
  {
    path: "/music",
    label: "Music",
    objectId: "shure-mic",
    kind: "music",
    animMs: 250,
    inTabBar: true,
  },
  {
    path: "/notes",
    label: "Notes",
    objectId: "notepad",
    kind: "notepad",
    animMs: 600,
    inTabBar: false,
  },
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
export function applyOverlayState(kind: OverlayKind | null, blogPath: string | null = null): void {
  const scene = useSceneStore.getState();
  const music = useMusicStore.getState();

  scene.setLaptopFocused(kind === "laptop");
  scene.setNotepadFocused(kind === "notepad");
  scene.setActiveBlogPath(kind === "laptop" ? blogPath : null);
  scene.setFocusTarget("default");

  // The browser session lasts as long as the visitor is inside CatOS, so bare
  // /blog keeps the strip — it is the desktop, which is CatOS's new-tab page.
  // Only leaving the laptop ends it; the window's close control clears explicitly.
  if (kind !== "laptop") {
    scene.closeAllBlogPaths();
  } else if (blogPath && isBrowserPath(blogPath)) {
    // A desktop item gets its own window, so it never joins the tab strip.
    scene.openBlogPath(blogPath);
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
