import { blogPaths } from "./blogPaths";
import { OVERLAY_LINKS, type OverlayKind, type OverlayLink } from "./overlays";

/**
 * The single source of overlay URL strings. Build paths here rather than
 * sprinkling literals through components. The blog's own scheme — a directory
 * and a trailing `.html` per kind of page — lives in `./blogPaths`.
 */
export const routes = {
  tent: "/",
  /** The CatOS desktop, with no window open. */
  blog: blogPaths.desktop,
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
 * Convenience callers for the 3D objects — request opening an overlay by intent,
 * with no path strings or event names at the call site.
 */
export const requestOpen = {
  blog: () => overlayNavigation.request(linkFor("laptop")),
  music: () => overlayNavigation.request(linkFor("music")),
  notes: () => overlayNavigation.request(linkFor("notepad")),
};
