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
import type { Decision } from '../types';
import { PhotoCard } from './PhotoCard';
import {
  collectAllPhotos,
  selectPhotos,
  moveSelectedToBin,
  clearSelection,
  AbortError,
} from './gphotos';

type Phase =
  | 'idle'
  | 'collecting'
  | 'sweeping'
  | 'review'
  | 'selecting'
  | 'deleting'
  | 'done'
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
  const abortRef = useRef<AbortController | null>(null);

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

  const startCollect = useCallback(async () => {
    const ac = new AbortController();
    abortRef.current = ac;
    setError('');
    setPhase('collecting');
    setStatus('Scanning the grid…');
    dispatch(sweepActions.fetchStart(location.pathname));
    try {
      const photos = await collectAllPhotos(
        (p) => setStatus(`Found ${p.count} photos…`),
        ac.signal
      );
      dispatch(sweepActions.fetchSuccess(photos));
      if (photos.length === 0) {
        setError('No photos found on this page. Open a search/date first, then sweep.');
        setPhase('error');
      } else {
        setDir(1);
        setPhase('sweeping');
      }
    } catch (e) {
      if (e instanceof AbortError) setPhase('idle');
      else {
        setError(e instanceof Error ? e.message : String(e));
        setPhase('error');
      }
    }
  }, []);

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
              keyboard. Nothing is deleted until you confirm.
            </p>
            <button style={{ ...btn(C.blue), width: '100%' }} onClick={startCollect}>
              Sweep this search
            </button>
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
