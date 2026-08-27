import { Button, DesktopIcon, Icon, MenuBar, Modal } from "@jordanscamp/ds";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { playSoftClick, playWindowOpen } from "../../audio/soundEffects";
import { iconOfDesktopItem, resolveBlogPage, type BlogPage } from "../../data/blogPages";
import { desktopItems, desktopItemSlug } from "../../data/desktopItems";
import { blogPaths, parseBlogPath } from "../../routing/blogPaths";
import { routes } from "../../routing/navigation";
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
 * One window at a time, browser included. Which window is open is URL-driven;
 * the *set* of open browser tabs is session state in the scene store.
 */
export default function LaptopScreenOverlay() {
  const navigate = useNavigate();
  const laptopFocused = useSceneStore((s) => s.laptopFocused);
  const activeBlogPath = useSceneStore((s) => s.activeBlogPath);
  const [clock, setClock] = useState("");
  const prevFocused = useRef(false);

  const activePage = useMemo(() => pageAt(activeBlogPath), [activeBlogPath]);

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

  /** The red light: back to the desktop, ending the browsing session. */
  const closeWindow = useCallback(() => {
    useSceneStore.getState().closeAllBlogPaths();
    navigate(routes.blog);
  }, [navigate]);

  const open = useCallback(
    (path: string) => {
      navigate(path);
      playWindowOpen();
    },
    [navigate],
  );

  // Base UI reports close intent (Escape). Close the open window first, else the
  // whole takeover — mirrors the layered Escape behaviour, no manual keydown.
  const onOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) return;
      playSoftClick();
      navigate(activePage ? routes.blog : routes.tent);
    },
    [activePage, navigate],
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

        {activePage && <CatosWindow page={activePage} onClose={closeWindow} />}

        {!activePage && (
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
