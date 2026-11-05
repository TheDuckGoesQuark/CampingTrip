import { type RefObject, useEffect } from "react";

function scrollportOf(node: Element): HTMLElement | null {
  for (let el = node.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") return el;
  }
  return null;
}

/**
 * Writes the height of the window the game sits in to `--macman-room`, padding
 * and all, so the cabinet fills it exactly. CSS cannot ask: the page column above it has only a
 * minimum height, which a percentage does not resolve against.
 */
export function useRoom(cabinet: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = cabinet.current;
    const scrollport = element && scrollportOf(element);
    if (!element || !scrollport) return;

    const measure = () => {
      element.style.setProperty("--macman-room", `${scrollport.clientHeight}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scrollport);
    return () => observer.disconnect();
  }, [cabinet]);
}
