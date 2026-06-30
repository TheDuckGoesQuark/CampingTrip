import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  sweepSlice,
  sweepActions,
  selectCurrentPhoto,
  selectIsComplete,
  selectStats,
  selectTrashIds,
} from '../store/sweepSlice';
import type { Decision, ScrapedPhoto } from '../types';
import { PhotoCard } from './PhotoCard';
import {
  collectAllPhotos,
  selectPhotos,
  moveSelectedToBin,
  clearSelection,
  AbortError,
} from './gphotos';
import { loadSeen, saveSeen, clearSeen } from './seen';

type Phase =
  | 'idle'
  | 'collecting'
  | 'sweeping'
  | 'review'
  | 'selecting'
  | 'deleting'
  | 'done'
  | 'allseen'
  | 'error';

const C = {
  panelBg: '#1a1b1e',
  border: '#373a40',
  text: '#e9ecef',
  dim: '#909296',
  green: '#40c057',
  red: '#fa5252',
  gray: '#5c5f66',
  blue: '#4dabf7',
};

const initSweep = () => sweepSlice.reducer(undefined, { type: '@@INIT' });

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        marginLeft: 8,
        borderRadius: 4,
        background: 'rgba(255,255,255,0.18)',
        border: '1px solid rgba(255,255,255,0.35)',
        fontSize: 12,
        lineHeight: 1,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

export function Overlay() {
  const [sweep, dispatch] = useReducer(sweepSlice.reducer, undefined, initSweep);
  const [phase, setPhase] = useState<Phase>('idle');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [minimised, setMinimised] = useState(false);
  const [dir, setDir] = useState(1);
  const [seenCount, setSeenCount] = useState(0);
  const [alreadyReviewed, setAlreadyReviewed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const collectedRef = useRef<ScrapedPhoto[]>([]);

  // Load the "already reviewed" memory once on mount (for the idle counter).
  useEffect(() => {
    loadSeen().then((s) => {
      seenRef.current = s;
      setSeenCount(s.size);
    });
  }, []);

  // Persist decisions as they happen, so a re-sweep skips reviewed photos even
  // if this sweep is abandoned partway.
  useEffect(() => {
    if (phase !== 'sweeping' && phase !== 'review') return;
    const ids = Object.keys(sweep.decisions);
    if (ids.length === 0) return;
    for (const id of ids) seenRef.current.add(id);
    saveSeen(seenRef.current);
    setSeenCount(seenRef.current.size);
  }, [sweep.decisions, phase]);

  const forgetReviewed = useCallback(() => {
    clearSeen();
    seenRef.current = new Set();
    setSeenCount(0);
    setAlreadyReviewed(0);
  }, []);

  // Google Photos is an SPA, so this content script mounts once and never
  // re-runs on a new search/date. Watch the URL and reset to idle when the user
  // navigates, so we never show a stale list. (The overlay never changes the
  // URL itself, so a change always means the user moved.)
  useEffect(() => {
    let last = location.href;
    const id = setInterval(() => {
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

  const s = { sweep };
  const current = selectCurrentPhoto(s);
  const stats = selectStats(s);
  const trashIds = selectTrashIds(s);

  useEffect(() => {
    if (phase === 'sweeping' && selectIsComplete(s)) setPhase('review');
  }, [phase, sweep.currentIndex, sweep.photos.length]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

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

  // Keyboard shortcuts during review (skip when typing in a Google field).
  useEffect(() => {
    if (phase !== 'sweeping') return;
    const onKey = (e: KeyboardEvent) => {
      const ae = document.activeElement;
      if (ae && /^(input|textarea|select)$/i.test(ae.tagName)) return;
      if ((ae as HTMLElement)?.isContentEditable) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          e.stopPropagation();
          triage('trash');
          break;
        case 'ArrowRight':
          e.preventDefault();
          e.stopPropagation();
          triage('keep');
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          triage('skip');
          break;
        case 'Backspace':
          e.preventDefault();
          e.stopPropagation();
          goBack();
          break;
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [phase, triage, goBack]);

  const startSweeping = useCallback((photos: ScrapedPhoto[]) => {
    dispatch(sweepActions.fetchStart(location.pathname));
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
      seenRef.current = seen;
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
        setPhase('allseen'); // everything here was reviewed on a previous sweep
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
      setPhase('deleting');
      setStatus(`Moving ${selected} photo${selected === 1 ? '' : 's'} to bin…`);
      await moveSelectedToBin(ac.signal);
      setStatus(`Moved ${selected} to bin.`);
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

  // ----- styles -----
  const btn = (bg: string, extra?: React.CSSProperties): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: bg,
    color: bg === 'transparent' ? C.dim : '#fff',
    border: bg === 'transparent' ? `1px solid ${C.border}` : 'none',
    borderRadius: 8,
    padding: '9px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    ...extra,
  });

  const busy = phase === 'collecting' || phase === 'selecting' || phase === 'deleting';
  const expanded = !minimised && phase !== 'idle';
  // The review deck is the main focus — let it fill most of the viewport.
  const big = expanded && phase === 'sweeping';

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 20,
    right: 20,
    width: big ? 'min(1200px, 94vw)' : expanded ? 'min(720px, calc(100vw - 40px))' : 360,
    maxWidth: 'calc(100vw - 40px)',
    height: big ? '92vh' : 'auto',
    maxHeight: 'calc(100vh - 40px)',
    display: 'flex',
    flexDirection: 'column',
    background: C.panelBg,
    color: C.text,
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    zIndex: 2147483000,
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
    transition: 'width 0.2s ease, height 0.2s ease',
  };

  if (minimised) {
    return (
      <div style={{ ...panelStyle, width: 200 }}>
        <button
          style={{ ...btn(C.blue), width: '100%', borderRadius: 0, padding: 12 }}
          onClick={() => setMinimised(false)}
        >
          🧹 PhotoBroom
        </button>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <strong style={{ fontSize: 14 }}>🧹 PhotoBroom</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          {busy && (
            <button style={btn(C.red, { padding: '6px 12px' })} onClick={stop}>
              ■ Stop
            </button>
          )}
          <button style={btn('transparent', { padding: '6px 10px' })} onClick={() => setMinimised(true)}>
            —
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: 14,
          ...(big ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : {}),
        }}
      >
        {phase === 'idle' && (
          <>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: C.dim, lineHeight: 1.5 }}>
              Open a search or date in Google Photos, then sweep through the results with your
              keyboard. Already-reviewed photos are skipped, and nothing is deleted until you
              confirm.
            </p>
            <button style={{ ...btn(C.blue), width: '100%' }} onClick={startCollect}>
              Sweep this search
            </button>
            {seenCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 10,
                }}
              >
                <span style={{ fontSize: 12, color: C.dim }}>
                  {seenCount.toLocaleString()} photo{seenCount === 1 ? '' : 's'} remembered as reviewed
                </span>
                <button style={btn('transparent', { padding: '4px 10px', fontSize: 12 })} onClick={forgetReviewed}>
                  Forget
                </button>
              </div>
            )}
          </>
        )}

        {phase === 'allseen' && (
          <>
            <p style={{ margin: '0 0 12px', fontSize: 14 }}>
              All {collectedRef.current.length} photo
              {collectedRef.current.length === 1 ? '' : 's'} here have already been reviewed on this
              machine.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btn(C.blue), flex: 1 }} onClick={sweepAll}>
                Sweep them anyway
              </button>
              <button style={btn('transparent')} onClick={forgetReviewed}>
                Forget memory
              </button>
            </div>
          </>
        )}

        {busy && (
          <div style={{ fontSize: 13, color: C.dim, display: 'flex', alignItems: 'center' }}>
            <Spinner />
            <span style={{ marginLeft: 8 }}>{status}</span>
          </div>
        )}

        {phase === 'sweeping' && current && (
          <>
            <div
              style={{
                position: 'relative',
                width: '100%',
                ...(big ? { flex: 1, minHeight: 0 } : { height: 'min(58vh, 460px)' }),
                marginBottom: 12,
              }}
            >
              <AnimatePresence custom={dir} initial={false}>
                <PhotoCard key={current.id} photo={current} direction={dir} />
              </AnimatePresence>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <button style={{ ...btn(C.red), flex: 1 }} onClick={() => triage('trash')}>
                🗑 Bin <Kbd>←</Kbd>
              </button>
              <button style={{ ...btn(C.gray), flex: 1 }} onClick={() => triage('skip')}>
                Skip <Kbd>↑</Kbd>
              </button>
              <button style={{ ...btn(C.green), flex: 1 }} onClick={() => triage('keep')}>
                ♥ Keep <Kbd>→</Kbd>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: C.dim }}>
              <button
                style={btn('transparent', { padding: '5px 10px' })}
                onClick={goBack}
                disabled={sweep.currentIndex === 0}
              >
                Undo <Kbd>⌫</Kbd>
              </button>
              <span>
                {stats.total - stats.remaining}/{stats.total} · 🗑 {stats.trashed} · ♥ {stats.kept} · ↑ {stats.skipped}
              </span>
              <button style={btn('transparent', { padding: '5px 10px' })} onClick={() => setPhase('review')}>
                Review →
              </button>
            </div>
          </>
        )}

        {phase === 'review' && (
          <>
            <p style={{ margin: '0 0 10px', fontSize: 15 }}>
              <strong style={{ color: C.red }}>{trashIds.length}</strong> to bin ·{' '}
              <strong style={{ color: C.green }}>{stats.kept}</strong> kept ·{' '}
              <strong style={{ color: C.dim }}>{stats.skipped}</strong> skipped
            </p>
            {alreadyReviewed > 0 && (
              <p style={{ margin: '0 0 8px', fontSize: 12, color: C.dim }}>
                ({alreadyReviewed} already reviewed on a previous sweep were skipped.)
              </p>
            )}
            <p style={{ margin: '0 0 14px', fontSize: 12, color: C.dim, lineHeight: 1.5 }}>
              This selects those {trashIds.length} photos in Google Photos and moves them to bin
              (recoverable for 60 days). You can hit Stop at any point.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btn(C.red), flex: 1 }} disabled={trashIds.length === 0} onClick={confirmDelete}>
                Move {trashIds.length} to bin
              </button>
              <button style={btn('transparent')} onClick={() => { setDir(-1); setPhase('sweeping'); }}>
                Back
              </button>
            </div>
          </>
        )}

        {phase === 'done' && (
          <>
            <p style={{ margin: '0 0 14px', fontSize: 15 }}>✅ {status || 'Done.'}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btn(C.blue), flex: 1 }} onClick={resetAll}>
                Sweep another
              </button>
              <button style={btn('transparent')} onClick={() => setMinimised(true)}>
                Close
              </button>
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: C.red, lineHeight: 1.5 }}>{error}</p>
            <button style={{ ...btn(C.blue), width: '100%' }} onClick={resetAll}>
              Start over
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        border: '2px solid #4dabf7',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'pb-spin 0.8s linear infinite',
      }}
    />
  );
}
