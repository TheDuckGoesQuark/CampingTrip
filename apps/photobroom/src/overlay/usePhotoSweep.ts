import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  sweepSlice,
  sweepActions,
  selectCurrentPhoto,
  selectIsComplete,
  selectStats,
  selectTrashIds,
} from '../store/sweepSlice';
import type { Decision, ScrapedPhoto } from '../types';
import {
  collectAllPhotos,
  selectPhotos,
  moveSelectedToBin,
  clearSelection,
  AbortError,
} from './gphotos';
import { loadSeen, saveSeen, clearSeen } from './seen';

export type Phase =
  | 'idle'
  | 'collecting'
  | 'sweeping'
  | 'review'
  | 'selecting'
  | 'deleting'
  | 'done'
  | 'allseen'
  | 'error';

const initSweep = () => sweepSlice.reducer(undefined, { type: '@@INIT' });

/**
 * Owns the whole PhotoBroom sweep flow: the phase state machine, the Google
 * Photos automation (collect → select → bin), reviewed-photo memory, keyboard
 * shortcuts, and abort wiring. The overlay components are pure render on top of
 * what this returns.
 */
export function usePhotoSweep() {
  const [sweep, dispatch] = useReducer(sweepSlice.reducer, undefined, initSweep);
  const [phase, setPhase] = useState<Phase>('idle');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [dir, setDir] = useState(1);
  const [seenCount, setSeenCount] = useState(0);
  const [alreadyReviewed, setAlreadyReviewed] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  // Photos reviewed on PRIOR sweeps (loaded at sweep start, immutable during a
  // sweep). This sweep's decisions are layered on top when persisting, so undo
  // correctly un-remembers a photo.
  const baseSeenRef = useRef<Set<string>>(new Set());
  const collectedRef = useRef<ScrapedPhoto[]>([]);
  // Mirror of `phase` readable inside the long-lived interval closure below.
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const state = { sweep };
  const current = selectCurrentPhoto(state);
  const stats = selectStats(state);
  const trashIds = selectTrashIds(state);

  // Load reviewed-memory once on mount (for the idle counter).
  useEffect(() => {
    loadSeen().then((s) => {
      baseSeenRef.current = s;
      setSeenCount(s.size);
    });
  }, []);

  // Persist (prior-seen ∪ this sweep's decisions) whenever decisions change.
  // Recomputing from the immutable base (rather than only adding) means undoing
  // a decision removes that id from what gets saved.
  useEffect(() => {
    if (phase !== 'sweeping' && phase !== 'review') return;
    const merged = new Set(baseSeenRef.current);
    for (const id of Object.keys(sweep.decisions)) merged.add(id);
    saveSeen(merged);
    setSeenCount(merged.size);
  }, [sweep.decisions, phase]);

  // Google Photos is an SPA — this content script mounts once and never re-runs
  // on a new search. Watch the URL and reset to idle on navigation so we don't
  // show a stale list, but never disturb an in-flight scan/select/delete.
  useEffect(() => {
    let last = location.href;
    const id = setInterval(() => {
      const p = phaseRef.current;
      if (p === 'collecting' || p === 'selecting' || p === 'deleting') return;
      if (location.href === last) return;
      last = location.href;
      abortRef.current?.abort();
      dispatch(sweepActions.reset());
      collectedRef.current = [];
      setAlreadyReviewed(0);
      setStatus('');
      setError('');
      setPhase('idle');
    }, 800);
    return () => clearInterval(id);
  }, []);

  // Advance to the review summary once the deck is exhausted.
  useEffect(() => {
    if (phase === 'sweeping' && selectIsComplete(state)) setPhase('review');
  }, [phase, sweep.currentIndex, sweep.photos.length]);

  const triage = useCallback(
    (decision: Decision) => {
      if (!current) return;
      setDir(1);
      dispatch(sweepActions.decide({ id: current.id, decision }));
    },
    [current]
  );

  const goBack = useCallback(() => {
    setDir(-1);
    dispatch(sweepActions.undo());
  }, []);

  // Keyboard shortcuts while reviewing (ignored when typing in a Google field).
  useEffect(() => {
    if (phase !== 'sweeping') return;
    const onKey = (e: KeyboardEvent) => {
      const ae = document.activeElement;
      if (ae && /^(input|textarea|select)$/i.test(ae.tagName)) return;
      if ((ae as HTMLElement)?.isContentEditable) return;
      const action: Record<string, () => void> = {
        ArrowLeft: () => triage('trash'),
        ArrowRight: () => triage('keep'),
        ArrowUp: () => triage('skip'),
        Backspace: goBack,
      };
      const run = action[e.key];
      if (!run) return;
      e.preventDefault();
      e.stopPropagation();
      run();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [phase, triage, goBack]);

  const startSweeping = useCallback((photos: ScrapedPhoto[]) => {
    dispatch(sweepActions.fetchStart());
    dispatch(sweepActions.fetchSuccess(photos));
    setDir(1);
    setPhase('sweeping');
  }, []);

  const startCollect = useCallback(async () => {
    const ac = new AbortController();
    abortRef.current = ac;
    setError('');
    setPhase('collecting');
    setStatus('Scanning the grid…');
    try {
      const seen = await loadSeen();
      baseSeenRef.current = seen;
      setSeenCount(seen.size);
      const photos = await collectAllPhotos(
        (p) => setStatus(`Found ${p.count} photos…`),
        ac.signal
      );
      collectedRef.current = photos;
      const fresh = photos.filter((p) => !seen.has(p.id));
      setAlreadyReviewed(photos.length - fresh.length);

      if (photos.length === 0) {
        setError('No photos found on this page. Open a search/date first, then sweep.');
        setPhase('error');
      } else if (fresh.length === 0) {
        setPhase('allseen');
      } else {
        startSweeping(fresh);
      }
    } catch (e) {
      if (e instanceof AbortError) setPhase('idle');
      else {
        setError(e instanceof Error ? e.message : String(e));
        setPhase('error');
      }
    }
  }, [startSweeping]);

  /** "Sweep them anyway" — review the already-seen photos we just collected. */
  const sweepAll = useCallback(() => {
    setAlreadyReviewed(0);
    startSweeping(collectedRef.current);
  }, [startSweeping]);

  const confirmDelete = useCallback(async () => {
    if (trashIds.length === 0) {
      setPhase('done');
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setError('');
    try {
      setPhase('selecting');
      setStatus(`Selecting 0/${trashIds.length}…`);
      const selected = await selectPhotos(
        trashIds,
        (p) => setStatus(`Selecting ${p.selected}/${p.target}…`),
        ac.signal
      );
      if (selected === 0) {
        throw new Error("Couldn't select any photos — Google's grid may have changed.");
      }
      setPhase('deleting');
      setStatus(`Moving ${selected} photo${selected === 1 ? '' : 's'} to bin…`);
      await moveSelectedToBin(ac.signal);
      const shortfall = trashIds.length - selected;
      setStatus(
        shortfall > 0
          ? `Moved ${selected} to bin (${shortfall} couldn't be selected — try those again).`
          : `Moved ${selected} to bin.`
      );
      setPhase('done');
    } catch (e) {
      clearSelection();
      if (e instanceof AbortError) setPhase('review');
      else {
        setError(e instanceof Error ? e.message : String(e));
        setPhase('error');
      }
    }
  }, [trashIds]);

  const resetAll = useCallback(() => {
    dispatch(sweepActions.reset());
    setPhase('idle');
    setError('');
    setStatus('');
  }, []);

  const forgetReviewed = useCallback(() => {
    clearSeen();
    baseSeenRef.current = new Set();
    setSeenCount(0);
    setAlreadyReviewed(0);
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return {
    // state
    phase,
    status,
    error,
    dir,
    seenCount,
    alreadyReviewed,
    current,
    stats,
    trashIds,
    canUndo: sweep.currentIndex > 0,
    collectedCount: collectedRef.current.length,
    // actions
    startCollect,
    sweepAll,
    triage,
    goBack,
    confirmDelete,
    resetAll,
    forgetReviewed,
    stop,
    goToReview: useCallback(() => setPhase('review'), []),
    backToSweeping: useCallback(() => {
      setDir(-1);
      setPhase('sweeping');
    }, []),
  };
}
