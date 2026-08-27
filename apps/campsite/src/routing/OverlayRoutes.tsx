import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import WelcomeScreen from "../components/WelcomeScreen/WelcomeScreen";
import { pathForLegacySlug } from "../data/blogPages";
import { useSessionStore } from "../store/sessionStore";
import { blogPathFor, parseBlogPath, stripHtml } from "./blogPaths";
import { applyOverlayState, closeOverlays } from "./overlays";

/**
 * Index route ("/"): the welcome gate and the canonical "everything closed"
 * state. The tent scene itself lives in <SceneRoot>; this only owns the intro.
 */
export function Landing() {
  const hasCompletedWelcome = useSessionStore((s) => s.hasCompletedWelcome);
  const [showWelcome, setShowWelcome] = useState(!hasCompletedWelcome);

  // Being at "/" means no overlay is open.
  useEffect(() => {
    closeOverlays();
  }, []);

  // Keep the welcome screen mounted through its fade-out, then unmount it.
  useEffect(() => {
    if (hasCompletedWelcome && showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 1400);
      return () => clearTimeout(timer);
    }
    if (!hasCompletedWelcome && !showWelcome) {
      setShowWelcome(true);
    }
  }, [hasCompletedWelcome, showWelcome]);

  return showWelcome ? <WelcomeScreen /> : null;
}

/**
 * Where a bare `/blog/<slug>` should go now that the scheme has a directory per
 * kind. Links to the flat form went out before it did, so they still resolve.
 */
function legacyTargetFor(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 2 || segments[0] !== "blog") return null;
  return pathForLegacySlug(stripHtml(decodeURIComponent(segments[1])));
}

/**
 * Everything under `/blog` — the CatOS desktop, and whichever page the path
 * names. Matched as a splat and read back with `parseBlogPath` rather than as a
 * route per kind, so the URL scheme is defined in exactly one place.
 *
 * An unrecognised path lands on the desktop with no window, which is a gentler
 * 404 than being thrown out to the tent.
 */
export function BlogRoute() {
  const { pathname } = useLocation();
  const ref = parseBlogPath(pathname);
  // Canonicalised, so `/blog/posts/x` and `/blog/posts/x.html` are one tab and
  // the address bar always shows the form with the extension.
  const canonical = ref ? blogPathFor(ref) : null;
  const legacy = ref ? null : legacyTargetFor(pathname);

  useEffect(() => {
    // Skip the state change on a path we are about to leave.
    if (legacy) return;
    applyOverlayState("laptop", canonical);
  }, [canonical, legacy]);

  return legacy ? <Navigate to={legacy} replace /> : null;
}

/** /notes — the notepad journal. */
export function NotesRoute() {
  useEffect(() => {
    applyOverlayState("notepad");
  }, []);
  return null;
}

/** /music — the iPod music player. */
export function MusicRoute() {
  useEffect(() => {
    applyOverlayState("music");
  }, []);
  return null;
}
