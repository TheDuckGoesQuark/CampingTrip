import { MenuBar } from "@jordanscamp/ds";
import { SpeakerHigh, SpeakerLow, SpeakerNone, SpeakerSlash } from "@jordanscamp/ds/icons";

import { useSessionStore } from "../../store/sessionStore";
import VolumeSlider from "../overlays/VolumeSlider";

import styles from "./catos.module.css";

/** What the bar's other glyphs measure — `Icon size="md"`. */
const GLYPH_PX = 16;

export type VolumeLevel = "muted" | "quiet" | "mid" | "loud";

export function volumeLevel(volume: number): VolumeLevel {
  if (volume <= 0) return "muted";
  if (volume < 0.34) return "quiet";
  if (volume < 0.67) return "mid";
  return "loud";
}

const GLYPHS: Record<VolumeLevel, typeof SpeakerHigh> = {
  muted: SpeakerSlash,
  quiet: SpeakerNone,
  mid: SpeakerLow,
  loud: SpeakerHigh,
};

/** Written out rather than scaled, so the outline stays one pixel wide. */
const RAMP = { width: 120, height: 20, left: 0.5, right: 119.5, base: 17.5, apex: 2.5 };

/* Two polygons rather than one clipped: the filled part is a trapezoid cut from
   the same slope, so it needs no clip path and so no generated id. */
function VolumeRamp({ fraction }: { fraction: number }) {
  const edgeX = RAMP.left + (RAMP.right - RAMP.left) * fraction;
  const edgeY = RAMP.base - (RAMP.base - RAMP.apex) * fraction;

  return (
    <svg
      className={styles.volumeRamp}
      width={RAMP.width}
      height={RAMP.height}
      viewBox={`0 0 ${RAMP.width} ${RAMP.height}`}
      aria-hidden
    >
      <polygon
        className={styles.volumeRampTrack}
        points={`${RAMP.left},${RAMP.base} ${RAMP.right},${RAMP.apex} ${RAMP.right},${RAMP.base}`}
      />
      <polygon
        className={styles.volumeRampFill}
        points={`${RAMP.left},${RAMP.base} ${edgeX.toFixed(1)},${edgeY.toFixed(1)} ${edgeX.toFixed(1)},${RAMP.base}`}
      />
    </svg>
  );
}

/* Its own component so a drag re-renders a bar item, not every open window. */
export default function VolumeMenu() {
  const volume = useSessionStore((s) => s.volume);
  const percent = Math.round(volume * 100);
  const Glyph = GLYPHS[volumeLevel(volume)];

  return (
    <MenuBar.Panel ariaLabel={`Volume — ${percent}%`} label={<Glyph size={GLYPH_PX} aria-hidden />}>
      <div className={styles.volumePanel}>
        <SpeakerNone size={GLYPH_PX} aria-hidden />
        <span className={styles.volumeTrack}>
          <VolumeRamp fraction={volume} />
          <VolumeSlider className={styles.volumeFader} />
        </span>
        <SpeakerHigh size={GLYPH_PX} aria-hidden />
        <span className={styles.volumeReadout} aria-hidden>
          {percent}%
        </span>
      </div>
    </MenuBar.Panel>
  );
}
