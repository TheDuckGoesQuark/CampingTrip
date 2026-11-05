import { useEffect, useRef } from "react";

export const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const;

/**
 * The last few keys, as long as the code, with `key` on the end. Matching the
 * whole tail rather than counting progress means a stray third Up still
 * leaves the last two counting towards the code.
 */
export function remember(recent: readonly string[], key: string): string[] {
  const normalised = key.length === 1 ? key.toLowerCase() : key;
  return [...recent, normalised].slice(-KONAMI.length);
}

export function isKonami(recent: readonly string[]): boolean {
  return recent.length === KONAMI.length && recent.every((key, i) => key === KONAMI[i]);
}

/** A field being typed in, or a focused region that takes the keyboard for itself, such as the game. */
function isClaimed(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement &&
      (target.isContentEditable || target.closest('[role="application"]') !== null))
  );
}

/**
 * The code's arrows walk the menu bar when it has focus, and Down opens a menu,
 * so typing it there leaves one open. Closing it is the Escape a visitor would
 * press, which closes the menu and nothing behind it.
 */
function closeMenuAround(target: EventTarget | null): void {
  if (!(target instanceof HTMLElement) || !target.closest('[role="menu"]')) return;
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );
}

/**
 * Calls `onCode` when the Konami code is typed while `armed`. It listens in the
 * capture phase, because the menu bar that has focus when CatOS opens stops
 * the keys it handles, letters included. It only listens: nothing is prevented
 * or stopped, so every other handler sees every key as before. Keys typed into
 * a field or aimed at the game are not counted.
 */
export function useKonamiCode(armed: boolean, onCode: () => void): void {
  const latest = useRef(onCode);
  useEffect(() => {
    latest.current = onCode;
  }, [onCode]);

  useEffect(() => {
    if (!armed) return;
    let recent: string[] = [];
    const onKeyDown = (event: KeyboardEvent) => {
      if (isClaimed(event.target)) return;
      recent = remember(recent, event.key);
      if (!isKonami(recent)) return;
      recent = [];
      closeMenuAround(event.target);
      latest.current();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [armed]);
}
