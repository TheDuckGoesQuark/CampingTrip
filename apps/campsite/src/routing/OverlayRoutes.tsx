import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import WelcomeScreen from "../components/WelcomeScreen/WelcomeScreen";
import { useSessionStore } from "../store/sessionStore";
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

/** /blog and /blog/:slug — the laptop "CatOS" blog, optionally with a post open. */
export function BlogRoute() {
  const { slug } = useParams();
  useEffect(() => {
    applyOverlayState("laptop", slug ?? null);
  }, [slug]);
  return null;
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
