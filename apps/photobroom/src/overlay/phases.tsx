import { AnimatePresence } from 'framer-motion';
import { Button, Kbd, Spinner, colors as C } from './ui';
import { PhotoCard } from './PhotoCard';
import type { usePhotoSweep } from './usePhotoSweep';

type Sweep = ReturnType<typeof usePhotoSweep>;

const dimText: React.CSSProperties = { fontSize: 13, color: C.dim, lineHeight: 1.5 };

export function IdlePanel({ sweep }: { sweep: Sweep }) {
  return (
    <>
      <p style={{ margin: '0 0 12px', ...dimText }}>
        Open a search or date in Google Photos, then sweep through the results with your
        keyboard. Already-reviewed photos are skipped, and nothing is deleted until you confirm.
      </p>
      <Button onClick={sweep.startCollect} style={{ width: '100%' }}>
        Sweep this search
      </Button>
      {sweep.seenCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <span style={{ fontSize: 12, color: C.dim }}>
            {sweep.seenCount.toLocaleString()} photo{sweep.seenCount === 1 ? '' : 's'} remembered as
            reviewed
          </span>
          <Button color="transparent" onClick={sweep.forgetReviewed} style={{ padding: '4px 10px', fontSize: 12 }}>
            Forget
          </Button>
        </div>
      )}
    </>
  );
}

export function AllSeenPanel({ sweep }: { sweep: Sweep }) {
  return (
    <>
      <p style={{ margin: '0 0 12px', fontSize: 14 }}>
        All {sweep.collectedCount} photo{sweep.collectedCount === 1 ? '' : 's'} here have already been
        reviewed on this machine.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={sweep.sweepAll} style={{ flex: 1 }}>
          Sweep them anyway
        </Button>
        <Button color="transparent" onClick={sweep.forgetReviewed}>
          Forget memory
        </Button>
      </div>
    </>
  );
}

export function BusyPanel({ status }: { status: string }) {
  return (
    <div style={{ fontSize: 13, color: C.dim, display: 'flex', alignItems: 'center' }}>
      <Spinner />
      <span style={{ marginLeft: 8 }}>{status}</span>
    </div>
  );
}

export function ReviewDeck({ sweep, big }: { sweep: Sweep; big: boolean }) {
  const { current, dir, stats, triage, goBack, goToReview, canUndo } = sweep;
  if (!current) return null;
  return (
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
        <Button color="red" onClick={() => triage('trash')} style={{ flex: 1 }}>
          🗑 Bin <Kbd>←</Kbd>
        </Button>
        <Button color="gray" onClick={() => triage('skip')} style={{ flex: 1 }}>
          Skip <Kbd>↑</Kbd>
        </Button>
        <Button color="green" onClick={() => triage('keep')} style={{ flex: 1 }}>
          ♥ Keep <Kbd>→</Kbd>
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: C.dim }}>
        <Button color="transparent" onClick={goBack} disabled={!canUndo} style={{ padding: '5px 10px' }}>
          Undo <Kbd>⌫</Kbd>
        </Button>
        <span>
          {stats.total - stats.remaining}/{stats.total} · 🗑 {stats.trashed} · ♥ {stats.kept} · ↑{' '}
          {stats.skipped}
        </span>
        <Button color="transparent" onClick={goToReview} style={{ padding: '5px 10px' }}>
          Review →
        </Button>
      </div>
    </>
  );
}

export function ReviewSummary({ sweep }: { sweep: Sweep }) {
  const { trashIds, stats, alreadyReviewed, confirmDelete, backToSweeping } = sweep;
  return (
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
      <p style={{ margin: '0 0 14px', ...dimText, fontSize: 12 }}>
        This selects those {trashIds.length} photos in Google Photos and moves them to bin
        (recoverable for 60 days). You can hit Stop at any point.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button color="red" onClick={confirmDelete} disabled={trashIds.length === 0} style={{ flex: 1 }}>
          Move {trashIds.length} to bin
        </Button>
        <Button color="transparent" onClick={backToSweeping}>
          Back
        </Button>
      </div>
    </>
  );
}

export function DonePanel({ sweep, onClose }: { sweep: Sweep; onClose: () => void }) {
  return (
    <>
      <p style={{ margin: '0 0 14px', fontSize: 15 }}>✅ {sweep.status || 'Done.'}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={sweep.resetAll} style={{ flex: 1 }}>
          Sweep another
        </Button>
        <Button color="transparent" onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  );
}

export function ErrorPanel({ sweep }: { sweep: Sweep }) {
  return (
    <>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: C.red, lineHeight: 1.5 }}>{sweep.error}</p>
      <Button onClick={sweep.resetAll} style={{ width: '100%' }}>
        Start over
      </Button>
    </>
  );
}
