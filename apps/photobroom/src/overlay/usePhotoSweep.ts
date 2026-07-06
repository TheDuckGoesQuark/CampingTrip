import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import type { Decision } from "../types";
import {
  collectAllPhotos,
  selectPhotos,
  moveSelectedToBin,
  clearSelection,
  AbortError,
} from "./gphotos";
import { loadSeen, saveSeen, clearSeen } from "./seen";
import { reducer, initialState, deckOf, trashIds, type State } from "./sweepMachine";

/**
 * Drives the sweep flow: owns the state machine (see sweepMachine.ts) and the
 * side effects it can't — Google Photos automation, reviewed-photo memory, the
 * keyboard shortcuts, and SPA-navigation watching. All phase transitions live
 * in the pure reducer, so the only ref here is the AbortController handle.
 */
export function usePhotoSweep() {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    (): State => ({
      ...initialState,
      href: location.href,
    }),
  );
  const abortRef = useRef<AbortController | null>(null);
  const fresh = () => (abortRef.current = new AbortController()).signal;

  const deck = deckOf(state.view);
  const decisions = deck?.decisions;

  // Reviewed-photo memory. seenCount is derived (base ∪ this sweep's decisions),
  // and persistence reacts to decisions — no ids are ever "stuck" after undo.
  const seenCount = useMemo(() => {
    const merged = new Set(state.baseSeen);
    if (decisions) for (const id of Object.keys(decisions)) merged.add(id);
    return merged.size;
  }, [state.baseSeen, decisions]);

  useEffect(() => {
    loadSeen().then((baseSeen) => dispatch({ type: "seenLoaded", baseSeen }));
  }, []);

  useEffect(() => {
    if (!decisions) return;
    const merged = new Set(state.baseSeen);
    for (const id of Object.keys(decisions)) merged.add(id);
    saveSeen(merged);
  }, [decisions, state.baseSeen]);

  // SPA-navigation watch: dispatch the current URL; the reducer decides whether
  // to reset (and ignores it mid-automation). No phase ref needed.
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: "urlTick", href: location.href }), 800);
    return () => clearInterval(id);
  }, []);

  const triage = useCallback((decision: Decision) => dispatch({ type: "decide", decision }), []);
  const goBack = useCallback(() => dispatch({ type: "undo" }), []);

  // Keyboard shortcuts while reviewing (ignored when typing in a Google field).
  const sweeping = state.view.phase === "sweeping";
  useEffect(() => {
    if (!sweeping) return;
    const onKey = (e: KeyboardEvent) => {
      const ae = document.activeElement;
      if (ae && /^(input|textarea|select)$/i.test(ae.tagName)) return;
      if ((ae as HTMLElement)?.isContentEditable) return;
      const shortcuts: Record<string, () => void> = {
        ArrowLeft: () => triage("trash"),
        ArrowRight: () => triage("keep"),
        ArrowUp: () => triage("skip"),
        Backspace: goBack,
      };
      const run = shortcuts[e.key];
      if (!run) return;
      e.preventDefault();
      e.stopPropagation();
      run();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [sweeping, triage, goBack]);

  const startCollect = useCallback(async () => {
    const signal = fresh();
    try {
      dispatch({ type: "seenLoaded", baseSeen: await loadSeen() });
      dispatch({ type: "collecting", status: "Scanning the grid…" });
      const photos = await collectAllPhotos(
        (p) => dispatch({ type: "collecting", status: `Found ${p.count} photos…` }),
        signal,
      );
      dispatch({ type: "collected", photos });
    } catch (e) {
      if (e instanceof AbortError) dispatch({ type: "reset" });
      else dispatch({ type: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  const confirmDelete = useCallback(async () => {
    const ids = deck ? trashIds(deck) : [];
    if (ids.length === 0) {
      dispatch({ type: "done", status: "Nothing to bin." });
      return;
    }
    const signal = fresh();
    try {
      dispatch({ type: "selecting", status: `Selecting 0/${ids.length}…` });
      const selected = await selectPhotos(
        ids,
        (p) => dispatch({ type: "selecting", status: `Selecting ${p.selected}/${p.target}…` }),
        signal,
      );
      if (selected === 0) {
        throw new Error("Couldn't select any photos — Google's grid may have changed.");
      }
      dispatch({ type: "deleting", status: `Moving ${selected} to bin…` });
      await moveSelectedToBin(signal);
      const shortfall = ids.length - selected;
      dispatch({
        type: "done",
        status:
          shortfall > 0
            ? `Moved ${selected} to bin (${shortfall} couldn't be selected — try those again).`
            : `Moved ${selected} to bin.`,
      });
    } catch (e) {
      clearSelection();
      if (e instanceof AbortError) dispatch({ type: "toReview" });
      else dispatch({ type: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }, [deck]);

  const forget = useCallback(() => {
    clearSeen();
    dispatch({ type: "seenLoaded", baseSeen: new Set() });
  }, []);

  return {
    view: state.view,
    seenCount,
    startCollect,
    triage,
    goBack,
    confirmDelete,
    forget,
    sweepAll: useCallback(() => dispatch({ type: "sweepAll" }), []),
    toReview: useCallback(() => dispatch({ type: "toReview" }), []),
    backToSweeping: useCallback(() => dispatch({ type: "toSweeping" }), []),
    reset: useCallback(() => dispatch({ type: "reset" }), []),
    stop: useCallback(() => abortRef.current?.abort(), []),
  };
}
