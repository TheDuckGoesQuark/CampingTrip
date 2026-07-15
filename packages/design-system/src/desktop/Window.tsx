import { useState, type ReactNode } from "react";

import { Box, Paper, Text } from "../primitives";

export interface WindowProps {
  /** Title shown centred in the title bar. */
  title?: string;
  /** Fires when the red traffic light or the backdrop is clicked. */
  onClose?: () => void;
  /** Max width of the window in px. */
  maxWidth?: number;
  children: ReactNode;
}

/**
 * A floating desktop-style window: dimmed backdrop, macOS "traffic light"
 * controls, a centred title, and scrollable content. Pure chrome — pass any
 * content. Clicking the backdrop or the red light calls `onClose`.
 */
export function Window({ title, onClose, maxWidth = 520, children }: WindowProps) {
  return (
    <Box
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
      }}
    >
      <Paper
        onClick={(e) => e.stopPropagation()}
        radius="md"
        withBorder
        shadow="lg"
        style={{
          width: "90%",
          maxWidth,
          minHeight: 300,
          overflow: "hidden",
          animation: "jcWindowIn 0.25s ease-out",
        }}
      >
        <Box
          style={{
            height: 38,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            background: "rgba(0,0,0,0.25)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box style={{ display: "flex", gap: 6 }}>
            <TrafficLight color="#ff5f57" onClick={onClose} />
            <TrafficLight color="#febc2e" />
            <TrafficLight color="#28c840" />
          </Box>
          <Text size="sm" c="dimmed" style={{ flex: 1, textAlign: "center" }}>
            {title}
          </Text>
          <Box style={{ width: 52 }} />
        </Box>

        <Box style={{ padding: "24px 28px", maxHeight: "calc(80vh - 38px)", overflowY: "auto" }}>
          {children}
        </Box>
      </Paper>

      <style>{`@keyframes jcWindowIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </Box>
  );
}

function TrafficLight({ color, onClick }: { color: string; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const interactive = Boolean(onClick);
  return (
    <button
      type="button"
      aria-label={interactive ? "Close" : undefined}
      disabled={!interactive}
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation();
              onClick?.();
            }
          : undefined
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: color,
        border: "none",
        padding: 0,
        cursor: interactive ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 8,
        lineHeight: 1,
        color: hovered && interactive ? "rgba(0,0,0,0.5)" : "transparent",
      }}
    >
      {interactive ? "✕" : ""}
    </button>
  );
}
