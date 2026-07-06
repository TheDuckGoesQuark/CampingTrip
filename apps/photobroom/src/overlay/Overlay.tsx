import { useState } from "react";

import {
  IdlePanel,
  AllSeenPanel,
  BusyPanel,
  ReviewDeck,
  ReviewSummary,
  DonePanel,
  ErrorPanel,
} from "./phases";
import { Button, colors as C, FONT } from "./ui";
import { usePhotoSweep } from "./usePhotoSweep";

export function Overlay() {
  const s = usePhotoSweep();
  const [minimised, setMinimised] = useState(false);
  const { view } = s;

  const busy =
    view.phase === "collecting" || view.phase === "selecting" || view.phase === "deleting";
  const expanded = !minimised && view.phase !== "idle";
  // The review deck is the main focus — let it fill most of the viewport.
  const big = expanded && view.phase === "sweeping";

  const panel: React.CSSProperties = {
    position: "fixed",
    bottom: 20,
    right: 20,
    width: big ? "min(1200px, 94vw)" : expanded ? "min(720px, calc(100vw - 40px))" : 360,
    maxWidth: "calc(100vw - 40px)",
    height: big ? "92vh" : "auto",
    maxHeight: "calc(100vh - 40px)",
    display: "flex",
    flexDirection: "column",
    background: C.panelBg,
    color: C.text,
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
    zIndex: 2147483000,
    fontFamily: FONT,
    overflow: "hidden",
    transition: "width 0.2s ease, height 0.2s ease",
  };

  if (minimised) {
    return (
      <div style={{ ...panel, width: 200 }}>
        <Button
          onClick={() => setMinimised(false)}
          style={{ width: "100%", borderRadius: 0, padding: 12 }}
        >
          🧹 PhotoBroom
        </Button>
      </div>
    );
  }

  return (
    <div style={panel}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <strong style={{ fontSize: 14 }}>🧹 PhotoBroom</strong>
        <div style={{ display: "flex", gap: 8 }}>
          {busy && (
            <Button color="red" onClick={s.stop} style={{ padding: "6px 12px" }}>
              ■ Stop
            </Button>
          )}
          <Button
            color="transparent"
            onClick={() => setMinimised(true)}
            style={{ padding: "6px 10px" }}
          >
            —
          </Button>
        </div>
      </div>

      <div
        style={{
          padding: 14,
          ...(big ? { flex: 1, display: "flex", flexDirection: "column", minHeight: 0 } : {}),
        }}
      >
        {view.phase === "idle" && (
          <IdlePanel seenCount={s.seenCount} onSweep={s.startCollect} onForget={s.forget} />
        )}
        {view.phase === "allseen" && (
          <AllSeenPanel count={view.collected.length} onSweepAll={s.sweepAll} onForget={s.forget} />
        )}
        {(view.phase === "collecting" ||
          view.phase === "selecting" ||
          view.phase === "deleting") && <BusyPanel status={view.status} />}
        {view.phase === "sweeping" && (
          <ReviewDeck
            deck={view.deck}
            dir={view.dir}
            big={big}
            onTriage={s.triage}
            onUndo={s.goBack}
            onReview={s.toReview}
          />
        )}
        {view.phase === "review" && (
          <ReviewSummary deck={view.deck} onConfirm={s.confirmDelete} onBack={s.backToSweeping} />
        )}
        {view.phase === "done" && (
          <DonePanel status={view.status} onAgain={s.reset} onClose={() => setMinimised(true)} />
        )}
        {view.phase === "error" && <ErrorPanel message={view.message} onReset={s.reset} />}
      </div>
    </div>
  );
}
