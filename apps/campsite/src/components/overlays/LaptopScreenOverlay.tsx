import { DesktopIcon, Icon, MenuBar, Modal } from "@jordanscamp/ds";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { playSoftClick, playWindowOpen } from "../../audio/soundEffects";
import { iconOfDesktopItem, resolveBlogPage, type BlogPage } from "../../data/blogPages";
import { contactMailto, contactLabel } from "../../data/contactEmail";
import { desktopItems, desktopItemSlug } from "../../data/desktopItems";
import { blogPaths, parseBlogPath } from "../../routing/blogPaths";
import { routes } from "../../routing/navigation";
import {
  frontWindow,
  isBrowserWindow,
  isMailWindow,
  pathForWindow,
  WINDOW_MAIL,
} from "../../routing/windows";
import { useSceneStore } from "../../store/sceneStore";
import { useSessionStore } from "../../store/sessionStore";
import type { DesktopItem } from "../../types/desktop";
import CatosWindow from "../catos/CatosWindow";
import MouseMailWindow from "../catos/MouseMailWindow";

import styles from "../catos/catos.module.css";

/** Place in the stack: 0 is the backmost window. */
type OpenWindow = { id: string; stackOrder: number } & (
  | { kind: "page"; page: BlogPage }
  /** MouseMail shows no page, so it carries none. */
  | { kind: "mail" }
);

function pageAt(path: string | null): BlogPage | null {
  if (!path) return null;
  const ref = parseBlogPath(path);
  return ref ? resolveBlogPage(ref) : null;
}

/** An app icon launches its target; everything else opens its own window. */
function pathFor(item: Exclude<DesktopItem, { kind: "mail" }>): string {
  return item.kind === "app" ? item.opens : blogPaths.desk(desktopItemSlug(item));
}

/**
 * CatOS — the laptop's desktop, a full-screen Base UI takeover (so it traps
 * focus, returns focus on close, and handles Escape). Composes the DS
 * faux-desktop chrome with the campsite's content.
 *
 * The split: the browser owns everything worth reading, the desktop owns
 * everything else. So the rail launches CatNav, a junk drawer and the way
 * outside, and CatNav opens a homepage rather than treating the desktop as its
 * new-tab page.
 *
 * Several windows can be open together, stacked by `stackOrder` rather than by
 * DOM order. The URL names the front window; which others are open is session
 * state, since one URL cannot describe a desktop.
 */
export default function LaptopScreenOverlay() {
  const navigate = useNavigate();
  const laptopFocused = useSceneStore((s) => s.laptopFocused);
  const openWindows = useSceneStore((s) => s.openWindows);
  const browserPath = useSceneStore((s) => s.browserPath);
  const [clock, setClock] = useState("");
  const prevFocused = useRef(false);

  /**
   * The open windows, skipping any whose content no longer resolves. Rendered in
   * a fixed order — by id — with each window's place in the stack carried as a
   * number instead, so raising one never moves its node. See `stackOrder`.
   */
  const windows = useMemo(
    () =>
      openWindows
        .map((id, stackOrder): OpenWindow | null => {
          if (isMailWindow(id)) return { id, stackOrder, kind: "mail" };
          const page = pageAt(isBrowserWindow(id) ? browserPath : id);
          return page === null ? null : { id, stackOrder, kind: "page", page };
        })
        .filter((w): w is OpenWindow => w !== null)
        .sort((a, b) => a.id.localeCompare(b.id)),
    [openWindows, browserPath],
  );
  const anyOpen = windows.length > 0;

  // Update lastVisitedAt when leaving CatOS.
  useEffect(() => {
    if (prevFocused.current && !laptopFocused) {
      useSessionStore.getState().updateLastVisited();
    }
    prevFocused.current = laptopFocused;
  }, [laptopFocused]);

  // Live clock while open.
  useEffect(() => {
    if (!laptopFocused) return;
    const update = () =>
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [laptopFocused]);

  const open = useCallback(
    (path: string) => {
      navigate(path);
      playWindowOpen();
    },
    [navigate],
  );

  const shutDown = useCallback(() => {
    playSoftClick();
    navigate(routes.tent);
  }, [navigate]);

  const openMail = useCallback(() => {
    useSceneStore.getState().raiseWindow(WINDOW_MAIL);
    playWindowOpen();
  }, []);

  const launch = useCallback(
    (item: DesktopItem) => {
      if (item.kind === "mail") {
        openMail();
        return;
      }
      const path = pathFor(item);
      if (path === routes.tent) shutDown();
      else open(path);
    },
    [open, openMail, shutDown],
  );

  /**
   * The red light. Closing the front window hands the address bar to whatever is
   * behind it, and only an empty desktop goes back to bare /blog. Closing the
   * browser ends the browsing session, tab strip included.
   */
  const closeWindow = useCallback(
    (id: string) => {
      const scene = useSceneStore.getState();
      const remaining = scene.openWindows.filter((w) => w !== id);
      playSoftClick();
      scene.closeWindow(id);
      if (isBrowserWindow(id)) {
        scene.closeAllBlogPaths();
        scene.setBrowserPath(null);
      }
      const next = frontWindow(remaining);
      const nextPath = next ? pathForWindow(next, scene.browserPath) : null;
      navigate(nextPath ?? routes.blog);
    },
    [navigate],
  );

  const closeAllWindows = useCallback(() => {
    playSoftClick();
    useSceneStore.getState().closeAllWindows();
    navigate(routes.blog);
  }, [navigate]);

  /** Raising a window is not a new place, so it replaces rather than pushes. */
  const raise = useCallback(
    (id: string) => {
      const scene = useSceneStore.getState();
      if (frontWindow(scene.openWindows) === id) return;
      const path = pathForWindow(id, scene.browserPath);
      if (path) navigate(path, { replace: true });
    },
    [navigate],
  );

  // Base UI reports close intent (Escape). Close the front window first, else the
  // whole takeover — mirrors the layered Escape behaviour, no manual keydown.
  const onOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) return;
      playSoftClick();
      const front = frontWindow(useSceneStore.getState().openWindows);
      if (front) {
        closeWindow(front);
        return;
      }
      navigate(routes.tent);
    },
    [closeWindow, navigate],
  );

  return (
    <Modal
      variant="takeover"
      open={laptopFocused}
      onOpenChange={onOpenChange}
      ariaLabel="CatOS — the laptop blog"
    >
      <div className={styles.desktop}>
        {/* Wallpaper — soft green → ivory */}
        <div className={styles.wallpaper} />

        {/* Drawn on the bar rather than only in the menu or on the desktop: a
            window covers the desktop, and under 768px covers all of it, so
            leaving must not depend on moving one. */}
        <MenuBar
          left={
            <>
              <MenuBar.Menu
                ariaLabel="CatOS menu"
                label={
                  <>
                    <Icon name="cat" size="md" />
                    <span className={styles.menuBrandName}>CatOS</span>
                  </>
                }
              >
                <MenuBar.Item onClick={() => open(blogPaths.about)}>About CatOS</MenuBar.Item>
                <MenuBar.Separator />
                <MenuBar.Item onClick={closeAllWindows} disabled={!anyOpen}>
                  Close all windows
                </MenuBar.Item>
                <MenuBar.Separator />
                {/* Escape closes the front window first, so it only leaves when
                    there is nothing left to close. */}
                <MenuBar.Item onClick={shutDown} shortcut={anyOpen ? undefined : "Esc"}>
                  Touch grass
                </MenuBar.Item>
              </MenuBar.Menu>
              <span className={styles.menuDim}>CatNav</span>
            </>
          }
          right={
            <>
              <MenuBar.Action onClick={shutDown} title="Leave CatOS for the campsite">
                <Icon name="door-arrow" size="md" />
                Touch grass
              </MenuBar.Action>
              <span className={styles.menuDim}>{clock}</span>
            </>
          }
        />

        <div className={styles.rail}>
          {desktopItems.map((item) => (
            <DesktopIcon
              key={item.label}
              label={item.label}
              glyph={iconOfDesktopItem(item)}
              onClick={() => launch(item)}
            />
          ))}
        </div>

        {windows.map((window) =>
          window.kind === "mail" ? (
            contactMailto === undefined ? null : (
              <MouseMailWindow
                key={window.id}
                mailto={contactMailto}
                emailLabel={contactLabel ?? contactMailto}
                cascade={window.stackOrder}
                stackOrder={window.stackOrder}
                onFocus={() => raise(window.id)}
                onClose={() => closeWindow(window.id)}
              />
            )
          ) : (
            <CatosWindow
              key={window.id}
              page={window.page}
              // Both from the stack index, which is not a coincidence worth hiding:
              // a window opens on the end of the stack, so its index there is also
              // how many windows it has to step down and right of.
              cascade={window.stackOrder}
              stackOrder={window.stackOrder}
              onFocus={() => raise(window.id)}
              onClose={() => closeWindow(window.id)}
            />
          ),
        )}
      </div>
    </Modal>
  );
}
