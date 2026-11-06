import type { Dir } from "../engine/maze";

import styles from "./howTo.module.css";

/** Each arm of the little pad, in the drawing's units, around a hub at (40, 34). */
const ARMS: Record<Dir, { x: number; y: number; turn: number }> = {
  up: { x: 34, y: 16, turn: 0 },
  right: { x: 46, y: 28, turn: 90 },
  down: { x: 34, y: 40, turn: 180 },
  left: { x: 22, y: 28, turn: 270 },
};

function Pad({ lights }: { lights: Dir }) {
  return (
    <g>
      {(Object.keys(ARMS) as Dir[]).map((dir) => {
        const { x, y, turn } = ARMS[dir];
        return (
          <g key={dir}>
            <rect
              className={dir === lights ? styles.lights : styles.arm}
              x={x}
              y={y}
              width={12}
              height={12}
              rx={1.5}
            />
            <path
              className={dir === lights ? styles.lightsMark : styles.mark}
              d="M0 -3 L3 2 L-3 2 Z"
              transform={`translate(${x + 6} ${y + 6}) rotate(${turn})`}
            />
          </g>
        );
      })}
      <rect className={styles.arm} x={34} y={28} width={12} height={12} />
      <circle className={styles.hub} cx={40} cy={34} r={3} />
    </g>
  );
}

/** A fingertip, its tip at the origin, coming up from below. */
function Finger() {
  return (
    <g>
      <circle className={styles.ripple} r={5} />
      <rect className={styles.finger} x={-4.5} y={-1.5} width={9} height={30} rx={4.5} />
      <rect className={styles.nail} x={-2.5} y={0} width={5} height={5} rx={2} />
    </g>
  );
}

/**
 * The touch controls, shown rather than told, in the seconds before the first
 * move: a swipe anywhere, then a tap on the pad, each lighting the arm it asks for.
 */
export default function HowToSteer() {
  return (
    <div className={styles.howTo}>
      <p className={styles.title}>How to steer</p>
      <div className={styles.demos}>
        <figure className={styles.demo}>
          <svg
            viewBox="0 0 80 72"
            role="img"
            aria-label="A finger swipes left, and the pad's left arm lights"
          >
            <Pad lights="left" />
            <g className={styles.swiping}>
              <Finger />
            </g>
          </svg>
          <figcaption>Swipe anywhere</figcaption>
        </figure>
        <figure className={styles.demo}>
          <svg
            viewBox="0 0 80 72"
            role="img"
            aria-label="A finger taps the pad's up arm, and it lights"
          >
            <Pad lights="up" />
            <g className={styles.tapping}>
              <Finger />
            </g>
          </svg>
          <figcaption>Or tap the pad</figcaption>
        </figure>
      </div>
      <p className={styles.note}>Pause is up top</p>
    </div>
  );
}
