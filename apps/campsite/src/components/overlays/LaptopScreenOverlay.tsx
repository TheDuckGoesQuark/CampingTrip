import { Button, DesktopIcon, Icon, MenuBar, Modal } from "@jordanscamp/ds";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { playSoftClick, playWindowOpen } from "../../audio/soundEffects";
import { iconOfDesktopItem, resolveBlogPage, type BlogPage } from "../../data/blogPages";
import { desktopItems, desktopItemSlug } from "../../data/desktopItems";
import { blogPaths, parseBlogPath } from "../../routing/blogPaths";
import { routes } from "../../routing/navigation";
import { frontWindow, isBrowserWindow, pathForWindow } from "../../routing/windows";
import { useSceneStore } from "../../store/sceneStore";
import { useSessionStore } from "../../store/sessionStore";
import type { DesktopItem } from "../../types/desktop";
import CatosWindow from "../catos/CatosWindow";

import styles from "../catos/catos.module.css";

function pageAt(path: string | null): BlogPage | null {
  if (!path) return null;
  const ref = parseBlogPath(path);
  return ref ? resolveBlogPage(ref) : null;
}

/** An app icon launches its target; everything else opens its own window. */
function pathFor(item: DesktopItem): string {
  return item.kind === "app" ? item.opens : blogPaths.desk(desktopItemSlug(item));
}

/**
 * CatOS — the laptop's desktop, a full-screen Base UI takeover (so it traps
 * focus, returns focus on close, and handles Escape). Composes the DS
 * faux-desktop chrome with the campsite's content.
 *
 * The split: the browser owns everything worth reading, the desktop owns
 * everything else. So the rail launches CatNav and a junk drawer, and CatNav
 * opens a homepage rather than treating the desktop as its new-tab page.
 *
 * Several windows can be open together. They render back to front, so paint
 * order is DOM order and raising one means moving it last. The URL names the
 * front window; which others are open is session state, since one URL cannot
 * describe a desktop.
 */
export default function LaptopScreenOverlay() {
  const navigate = useNavigate();
  const laptopFocused = useSceneStore((s) => s.laptopFocused);
  const openWindows = useSceneStore((s) => s.openWindows);
  const browserPath = useSceneStore((s) => s.browserPath);
  const [clock, setClock] = useState("");
  const prevFocused = useRef(false);

  /** Back to front, skipping any window whose content no longer resolves. */
  const stack = useMemo(
    () =>
      openWindows
        .map((id) => ({ id, page: pageAt(isBrowserWindow(id) ? browserPath : id) }))
        .filter((w): w is { id: string; page: BlogPage } => w.page !== null),
    [openWindows, browserPath],
  );
  const anyOpen = stack.length > 0;

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

        <MenuBar
          left={
            <>
              <span className={styles.menuBrand}>
                <Icon name="cat" size="md" />
                <span className={styles.menuBrandName}>CatOS</span>
              </span>
              <span className={styles.menuDim}>CatNav</span>
            </>
          }
          right={<span className={styles.menuDim}>{clock}</span>}
        />

        <div className={styles.rail}>
          {desktopItems.map((item) => (
            <DesktopIcon
              key={item.label}
              label={item.label}
              glyph={iconOfDesktopItem(item)}
              onClick={() => open(pathFor(item))}
            />
          ))}
        </div>

        {stack.map((window, index) => (
          <CatosWindow
            key={window.id}
            page={window.page}
            cascade={index}
            onFocus={() => raise(window.id)}
            onClose={() => closeWindow(window.id)}
          />
        ))}

        {!anyOpen && (
          <div className={styles.backToTent}>
            <Button variant="ghost" size="sm" onClick={() => navigate(routes.tent)}>
              Back to tent
              <span className={styles.escHint}>Esc</span>
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
