import styles from "./MonitorGraph.module.css";

const WIDTH = 200;
const HEIGHT = 60;
const GRID_STEP = 10;
const HEADROOM = 4;

export interface MonitorGraphProps {
  /** The announced line, and the only part of this a screen reader gets. */
  label: string;
  values: number[];
  /**
   * How many values wide the graph is. With fewer values than slots they sit
   * at the right, as a monitor fills from the right. Defaults to the count.
   */
  slots?: number;
  /** The value that reaches the top. Defaults to the largest present. */
  max?: number;
  kind?: "bars" | "line";
}

/**
 * A system monitor's graph: a dark well with a grid, and one bar per value or
 * a stepped line through them. The geometry is SVG attributes, so a consumer
 * that forbids inline `style` can still draw one.
 */
export function MonitorGraph({ label, values, slots, max, kind = "bars" }: MonitorGraphProps) {
  const width = Math.max(1, slots ?? values.length);
  const top = Math.max(1, max ?? Math.max(0, ...values));
  const slotW = WIDTH / width;
  const offset = width - values.length;
  const rise = (value: number) => Math.min(HEIGHT, (value / top) * (HEIGHT - HEADROOM));
  const grid = Array.from({ length: WIDTH / GRID_STEP - 1 }, (_, i) => (i + 1) * GRID_STEP);

  return (
    <svg
      className={styles.graph}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <rect className={styles.well} width={WIDTH} height={HEIGHT} />
      {grid.map((x) => (
        <line key={`x${x}`} className={styles.grid} x1={x} y1={0} x2={x} y2={HEIGHT} />
      ))}
      {grid
        .filter((y) => y < HEIGHT)
        .map((y) => (
          <line key={`y${y}`} className={styles.grid} x1={0} y1={y} x2={WIDTH} y2={y} />
        ))}
      {kind === "bars" &&
        values.map((value, i) => (
          <rect
            key={i}
            className={styles.bar}
            x={(offset + i) * slotW + 1}
            y={HEIGHT - rise(value)}
            width={Math.max(0, slotW - 2)}
            height={rise(value)}
          />
        ))}
      {kind === "line" && values.length > 0 && (
        <polyline
          className={styles.line}
          points={values
            .flatMap((value, i) => {
              const y = HEIGHT - rise(value);
              const x = (offset + i) * slotW;
              return [`${x},${y}`, `${x + slotW},${y}`];
            })
            .join(" ")}
        />
      )}
    </svg>
  );
}
