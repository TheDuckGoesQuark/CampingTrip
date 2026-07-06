import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";

import type { Decision } from "../types";
import { PhotoCard } from "./PhotoCard";
import { currentPhoto, deckStats, trashIds, type Deck } from "./sweepMachine";
import { Button, Kbd, Spinner, colors as C } from "./ui";

const dimText: React.CSSProperties = { fontSize: 13, color: C.dim, lineHeight: 1.5 };

/** How many upcoming cards to prefetch so the next image is already cached. */
const PRELOAD_AHEAD = 3;

export function IdlePanel({
  seenCount,
  onSweep,
  onForget,
}: {
  seenCount: number;
  onSweep: () => void;
  onForget: () => void;
}) {
  return (
    <>
      <p style={{ margin: "0 0 12px", ...dimText }}>
        Open a search or date in Google Photos, then sweep through the results with your keyboard.
        Already-reviewed photos are skipped, and nothing is deleted until you confirm.
      </p>
      <Button onClick={onSweep} style={{ width: "100%" }}>
        Sweep this search
      </Button>
      {seenCount > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <span style={{ fontSize: 12, color: C.dim }}>
            {seenCount.toLocaleString()} photo{seenCount === 1 ? "" : "s"} remembered as reviewed
          </span>
          <Button
            color="transparent"
            onClick={onForget}
            style={{ padding: "4px 10px", fontSize: 12 }}
          >
            Forget
          </Button>
        </div>
      )}
    </>
  );
}

export function AllSeenPanel({
  count,
  onSweepAll,
  onForget,
}: {
  count: number;
  onSweepAll: () => void;
  onForget: () => void;
}) {
  return (
    <>
      <p style={{ margin: "0 0 12px", fontSize: 14 }}>
        All {count} photo{count === 1 ? "" : "s"} here have already been reviewed on this machine.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <Button onClick={onSweepAll} style={{ flex: 1 }}>
          Sweep them anyway
        </Button>
        <Button color="transparent" onClick={onForget}>
          Forget memory
        </Button>
      </div>
    </>
  );
}

export function BusyPanel({ status }: { status: string }) {
  return (
    <div style={{ fontSize: 13, color: C.dim, display: "flex", alignItems: "center" }}>
      <Spinner />
      <span style={{ marginLeft: 8 }}>{status}</span>
    </div>
  );
}

export function ReviewDeck({
  deck,
  dir,
  big,
  onTriage,
  onUndo,
  onReview,
}: {
  deck: Deck;
  dir: 1 | -1;
  big: boolean;
  onTriage: (d: Decision) => void;
  onUndo: () => void;
  onReview: () => void;
}) {
  // Prefetch the next few thumbnails into the browser cache so advancing is
  // instant — otherwise the next image only starts loading once it's shown.
  useEffect(() => {
    for (let i = 1; i <= PRELOAD_AHEAD; i++) {
      const next = deck.photos[deck.index + i];
      if (next) new Image().src = next.thumbnailUrl;
    }
  }, [deck.photos, deck.index]);

  const photo = currentPhoto(deck);
  if (!photo) return null;
  const stats = deckStats(deck);
  return (
    <>
      <div
        style={{
          position: "relative",
          width: "100%",
          ...(big ? { flex: 1, minHeight: 0 } : { height: "min(58vh, 460px)" }),
          marginBottom: 12,
        }}
      >
        <AnimatePresence custom={dir} initial={false}>
          <PhotoCard key={photo.id} photo={photo} direction={dir} />
        </AnimatePresence>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <Button color="red" onClick={() => onTriage("trash")} style={{ flex: 1 }}>
          🗑 Bin <Kbd>←</Kbd>
        </Button>
        <Button color="gray" onClick={() => onTriage("skip")} style={{ flex: 1 }}>
          Skip <Kbd>↑</Kbd>
        </Button>
        <Button color="green" onClick={() => onTriage("keep")} style={{ flex: 1 }}>
          ♥ Keep <Kbd>→</Kbd>
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: C.dim,
        }}
      >
        <Button
          color="transparent"
          onClick={onUndo}
          disabled={deck.index === 0}
          style={{ padding: "5px 10px" }}
        >
          Undo <Kbd>⌫</Kbd>
        </Button>
        <span>
          {stats.reviewed}/{stats.total} · 🗑 {stats.trashed} · ♥ {stats.kept} · ↑ {stats.skipped}
        </span>
        <Button color="transparent" onClick={onReview} style={{ padding: "5px 10px" }}>
          Review →
        </Button>
      </div>
    </>
  );
}

export function ReviewSummary({
  deck,
  onConfirm,
  onBack,
}: {
  deck: Deck;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const stats = deckStats(deck);
  const toBin = trashIds(deck).length;
  return (
    <>
      <p style={{ margin: "0 0 10px", fontSize: 15 }}>
        <strong style={{ color: C.red }}>{toBin}</strong> to bin ·{" "}
        <strong style={{ color: C.green }}>{stats.kept}</strong> kept ·{" "}
        <strong style={{ color: C.dim }}>{stats.skipped}</strong> skipped
      </p>
      {deck.alreadyReviewed > 0 && (
        <p style={{ margin: "0 0 8px", fontSize: 12, color: C.dim }}>
          ({deck.alreadyReviewed} already reviewed on a previous sweep were skipped.)
        </p>
      )}
      <p style={{ margin: "0 0 14px", ...dimText, fontSize: 12 }}>
        This selects those {toBin} photos in Google Photos and moves them to bin (recoverable for 60
        days). You can hit Stop at any point.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <Button color="red" onClick={onConfirm} disabled={toBin === 0} style={{ flex: 1 }}>
          Move {toBin} to bin
        </Button>
        <Button color="transparent" onClick={onBack}>
          Back
        </Button>
      </div>
    </>
  );
}

export function DonePanel({
  status,
  onAgain,
  onClose,
}: {
  status: string;
  onAgain: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <p style={{ margin: "0 0 14px", fontSize: 15 }}>✅ {status || "Done."}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <Button onClick={onAgain} style={{ flex: 1 }}>
          Sweep another
        </Button>
        <Button color="transparent" onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  );
}

export function ErrorPanel({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <>
      <p style={{ margin: "0 0 14px", fontSize: 13, color: C.red, lineHeight: 1.5 }}>{message}</p>
      <Button onClick={onReset} style={{ width: "100%" }}>
        Start over
      </Button>
    </>
  );
}
