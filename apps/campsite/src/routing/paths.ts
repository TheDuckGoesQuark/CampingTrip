/**
 * Pure URL ⇄ scene-state mapping. Kept separate from the RouteSync component so
 * it can be unit-tested without a router.
 *
 * Routes:
 *   /             → the 3D scene, all overlays closed
 *   /home         → laptop "CatOS" blog open
 *   /home/:slug   → laptop open with that post's window
 *   /notes        → notepad open
 *   /music        → music player open
 */

export interface OverlayState {
  laptop: boolean;
  notepad: boolean;
  music: boolean;
  postSlug: string | null;
}

export const CLOSED: OverlayState = {
  laptop: false,
  notepad: false,
  music: false,
  postSlug: null,
};

/** Which overlays a pathname implies. Unknown paths close everything. */
export function pathToState(pathname: string): OverlayState {
  const segments = pathname.replace(/\/+$/, "").split("/").filter(Boolean);

  if (segments[0] === "notes") return { ...CLOSED, notepad: true };
  if (segments[0] === "music") return { ...CLOSED, music: true };
  if (segments[0] === "home") {
    return { ...CLOSED, laptop: true, postSlug: segments[1] ?? null };
  }
  return CLOSED;
}

/**
 * Canonical path for a given overlay state. Precedence (only one overlay is
 * open at a time in practice): notepad → music → laptop(+post) → scene.
 */
export function stateToPath(state: OverlayState): string {
  if (state.notepad) return "/notes";
  if (state.music) return "/music";
  if (state.laptop) return state.postSlug ? `/home/${state.postSlug}` : "/home";
  return "/";
}
