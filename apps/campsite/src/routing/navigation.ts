import { OVERLAY_LINKS, type OverlayKind, type OverlayLink } from "./overlays";

/**
 * The single source of overlay URL strings, including path parameters. Build
 * paths here rather than sprinkling literals through components.
 */
export const routes = {
  tent: "/",
  blog: (slug?: string | null) => (slug ? `/blog/${encodeURIComponent(slug)}` : "/blog"),
  music: "/music",
  notes: "/notes",
} as const;

/** The tab/overlay link for a given overlay kind. */
export function linkFor(kind: OverlayKind): OverlayLink {
  const link = OVERLAY_LINKS.find((l) => l.kind === kind);
  if (!link) throw new Error(`No overlay link for kind "${kind}"`);
  return link;
}

/**
 * Encapsulated emitter for open-overlay requests coming from inside the R3F
 * Canvas, which can't reach the router. A typed module singleton — call
 * `overlayNavigation.request(link)` and `subscribe()` in SceneRoot — so the flow
 * is greppable and traceable instead of a loose `window` event + free-floating
 * listener.
 */
type Listener = (link: OverlayLink) => void;

function createOverlayNavigation() {
  const listeners = new Set<Listener>();
  return {
    request(link: OverlayLink): void {
      for (const listener of listeners) listener(link);
    },
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const overlayNavigation = createOverlayNavigation();

/**
 * The other direction: a 3D object announcing that its open flight has landed,
 * so `useSceneNavigate` can commit the URL on arrival instead of guessing with a
 * timer. Same reason for an emitter as above — the animation runs inside the
 * Canvas, and the router lives outside it.
 *
 * Not every overlay has a flight (the music player has no 3D move), and the tent
 * may not be mounted at all, so a caller must keep its own deadline rather than
 * assume this fires.
 */
function createOverlayFlight() {
  const listeners = new Set<(kind: OverlayKind) => void>();
  return {
    landed(kind: OverlayKind): void {
      for (const listener of listeners) listener(kind);
    },
    subscribe(listener: (kind: OverlayKind) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const overlayFlight = createOverlayFlight();

/**
 * Convenience callers for the 3D objects — request opening an overlay by intent,
 * with no path strings or event names at the call site.
 */
export const requestOpen = {
  blog: () => overlayNavigation.request(linkFor("laptop")),
  music: () => overlayNavigation.request(linkFor("music")),
  notes: () => overlayNavigation.request(linkFor("notepad")),
};
