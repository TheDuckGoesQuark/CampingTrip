import { useState } from 'react';
import { usePhotoSweep } from './usePhotoSweep';
import { Button, colors as C, FONT } from './ui';
import {
  IdlePanel,
  AllSeenPanel,
  BusyPanel,
  ReviewDeck,
  ReviewSummary,
  DonePanel,
  ErrorPanel,
} from './phases';

export function Overlay() {
  const sweep = usePhotoSweep();
  const [minimised, setMinimised] = useState(false);
  const { phase } = sweep;

  const busy = phase === 'collecting' || phase === 'selecting' || phase === 'deleting';
  const expanded = !minimised && phase !== 'idle';
  // The review deck is the main focus — let it fill most of the viewport.
  const big = expanded && phase === 'sweeping';

  const panel: React.CSSProperties = {
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
    fontFamily: FONT,
    overflow: 'hidden',
    transition: 'width 0.2s ease, height 0.2s ease',
  };

  if (minimised) {
    return (
      <div style={{ ...panel, width: 200 }}>
        <Button onClick={() => setMinimised(false)} style={{ width: '100%', borderRadius: 0, padding: 12 }}>
          🧹 PhotoBroom
        </Button>
      </div>
    );
  }

  return (
    <div style={panel}>
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
            <Button color="red" onClick={sweep.stop} style={{ padding: '6px 12px' }}>
              ■ Stop
            </Button>
          )}
          <Button color="transparent" onClick={() => setMinimised(true)} style={{ padding: '6px 10px' }}>
            —
          </Button>
        </div>
      </div>

      {/* Body — one block per phase */}
      <div style={{ padding: 14, ...(big ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : {}) }}>
        {phase === 'idle' && <IdlePanel sweep={sweep} />}
        {phase === 'allseen' && <AllSeenPanel sweep={sweep} />}
        {busy && <BusyPanel status={sweep.status} />}
        {phase === 'sweeping' && <ReviewDeck sweep={sweep} big={big} />}
        {phase === 'review' && <ReviewSummary sweep={sweep} />}
        {phase === 'done' && <DonePanel sweep={sweep} onClose={() => setMinimised(true)} />}
        {phase === 'error' && <ErrorPanel sweep={sweep} />}
      </div>
    </div>
  );
}
