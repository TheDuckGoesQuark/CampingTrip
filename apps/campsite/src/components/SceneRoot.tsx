import { lazy, Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { overlayNavigation } from "../routing/navigation";
import { useSceneNavigate } from "../routing/useSceneNavigate";
import { useSceneStore } from "../store/sceneStore";
import { useSessionStore } from "../store/sessionStore";
import CampfireLoadingScreen from "./CampfireLoadingScreen";
import ErrorBoundary from "./ErrorBoundary";
import OverlayTabBar from "./overlays/OverlayTabBar";
import SettingsMenu from "./overlays/SettingsMenu";
import TimeOfDayArc from "./overlays/TimeOfDayArc";

// Lazy-load the heavy 3D scene so the welcome screen renders instantly.
const TentScene = lazy(() => import("./TentScene/TentScene"));

/**
 * Layout route ("/"): the always-present tent, the loading screen and the tab
 * bar, with an <Outlet/> for the overlay routes. The URL is the single source of
 * truth — child routes declare which overlay is open; nothing here mirrors state
 * back to the URL.
 */
export default function SceneRoot() {
  const hasCompletedWelcome = useSessionStore((s) => s.hasCompletedWelcome);
  const sceneReady = useSceneStore((s) => s.sceneReady);
  const location = useLocation();
  const navigateWithFocus = useSceneNavigate();

  // Deep link straight to an overlay: skip the welcome intro for this visit.
  useEffect(() => {
    if (location.pathname !== "/" && !useSessionStore.getState().hasCompletedWelcome) {
      useSessionStore.getState().completeWelcome();
    }
    // Runs once on mount — deep-link detection only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3D objects render inside the R3F Canvas and can't reach the router, so they
  // ask the overlayNavigation emitter to open something; we turn that into a
  // real route change here.
  useEffect(() => overlayNavigation.subscribe(navigateWithFocus), [navigateWithFocus]);

  const showTent = hasCompletedWelcome || location.pathname !== "/";
  // The tent chrome appears only once the user is actually on the tent view —
  // not over the loading screen or the landing story.
  const showChrome = hasCompletedWelcome && sceneReady;

  return (
    <>
      {/* Campfire loading — always mounted, manages its own visibility/audio/fade */}
      <CampfireLoadingScreen />

      {showTent && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <TentScene visible={showTent} />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Tent chrome. DOM order = keyboard tab order:
          blog → music → notes (tab bar), settings, then the day/night control. */}
      {showChrome && (
        <>
          <OverlayTabBar />
          <SettingsMenu />
          <TimeOfDayArc />
        </>
      )}

      {/* Landing / Blog / Music / Notes */}
      <Outlet />
    </>
  );
}
