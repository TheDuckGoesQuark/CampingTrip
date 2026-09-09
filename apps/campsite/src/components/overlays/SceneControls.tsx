import { useState, useEffect, useRef, useCallback } from "react";

import { useSessionStore } from "../../store/sessionStore";

import styles from "./SceneControls.module.css";

/**
 * Visual effects and rain sit outside the popover, duplicating two of its rows,
 * because they are the ones people reach for mid-visit.
 */
export default function SceneControls() {
  const [open, setOpen] = useState(false);
  const clusterRef = useRef<HTMLDivElement>(null);

  const soundEnabled = useSessionStore((s) => s.soundEnabled);
  const ambienceEnabled = useSessionStore((s) => s.ambienceEnabled);
  const effectsEnabled = useSessionStore((s) => s.effectsEnabled);
  const setSoundEnabled = useSessionStore((s) => s.setSoundEnabled);
  const setAmbienceEnabled = useSessionStore((s) => s.setAmbienceEnabled);
  const setEffectsEnabled = useSessionStore((s) => s.setEffectsEnabled);
  const resetWelcome = useSessionStore((s) => s.resetWelcome);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (clusterRef.current && !clusterRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Delay to avoid the opening click from immediately closing
    const timeout = setTimeout(() => {
      window.addEventListener("mousedown", handler);
    }, 10);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousedown", handler);
    };
  }, [open]);

  const handleReset = useCallback(() => {
    setOpen(false);
    resetWelcome();
  }, [resetWelcome]);

  return (
    <div ref={clusterRef} className={styles.cluster}>
      <ControlButton
        label={effectsEnabled ? "Turn visual effects off" : "Turn visual effects on"}
        pressed={effectsEnabled}
        onClick={() => setEffectsEnabled(!effectsEnabled)}
      >
        <SparkleIcon />
      </ControlButton>

      <ControlButton
        label={ambienceEnabled ? "Turn ambience off" : "Turn ambience on"}
        pressed={ambienceEnabled}
        onClick={() => setAmbienceEnabled(!ambienceEnabled)}
      >
        {ambienceEnabled ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
      </ControlButton>

      <div className={styles.anchor}>
        <ControlButton label="Settings" expanded={open} onClick={() => setOpen((prev) => !prev)}>
          <GearIcon />
        </ControlButton>

        {open && (
          <div className={styles.panel}>
            <SettingRow
              text="🌿 Ambience"
              checked={ambienceEnabled}
              onChange={setAmbienceEnabled}
            />
            <SettingRow
              text={`${soundEnabled ? "🔊" : "🔇"} Sound effects`}
              checked={soundEnabled}
              onChange={setSoundEnabled}
            />
            <SettingRow
              text="✨ Visual effects"
              checked={effectsEnabled}
              onChange={setEffectsEnabled}
            />

            <div className={styles.divider} />

            <button className={styles.reset} onClick={handleReset}>
              Reset preferences
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ControlButton({
  label,
  pressed,
  expanded,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  expanded?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={styles.button}
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
    >
      {children}
    </button>
  );
}

function SettingRow({
  text,
  checked,
  onChange,
}: {
  text: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={styles.row}>
      <span>{text}</span>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </label>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={styles.switch}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    />
  );
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function SparkleIcon() {
  return (
    <svg {...iconProps}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
    </svg>
  );
}

function SpeakerOnIcon() {
  return (
    <svg {...iconProps}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 4.9a10 10 0 0 1 0 14.2" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg {...iconProps}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
