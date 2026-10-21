import { Text } from "@jordanscamp/ds";

import styles from "./deckFigure.module.css";

const COUNT = 280;
/** The three questions in the chain: the only components with anything new to show. */
const NEEDED = 3;
const COLS = 20;
const SIZE = 11;
const GAP = 2;
const GRID_TOP = 78;
const ROWS = Math.ceil(COUNT / COLS);

/** The slide's diagram: one click flowing down the chain, and every re-render it caused as a square. */
export default function ClickCascade() {
  return (
    <figure className={styles.figure}>
      <div className={styles.row}>
        <svg
          className={styles.diagram}
          viewBox="0 0 620 320"
          role="img"
          aria-label="A click on one question flows down a chain of two dependent questions, and a grid of 280 squares shows every component that re-rendered, of which only three needed to"
        >
          <defs>
            <marker
              id="cascade-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--brand-text-muted)" />
            </marker>
          </defs>
          <g fontSize="15">
            <text x="0" y="12" fill="var(--brand-text-muted)" fontSize="13">
              A chain of dependent questions
            </text>
            <rect
              x="0"
              y="20"
              width="250"
              height="56"
              rx="10"
              fill="var(--brand-surface)"
              stroke="var(--brand-border-strong)"
            />
            <text x="125" y="44" textAnchor="middle" fill="var(--brand-text)">
              Headache? Yes
            </text>
            <text x="125" y="64" textAnchor="middle" fill="var(--brand-text-muted)" fontSize="13">
              one click
            </text>
            <rect
              x="0"
              y="122"
              width="250"
              height="56"
              rx="10"
              fill="var(--brand-surface)"
              stroke="var(--brand-border-strong)"
            />
            <text x="125" y="146" textAnchor="middle" fill="var(--brand-text)">
              Severity score
            </text>
            <text x="125" y="166" textAnchor="middle" fill="var(--brand-text-muted)" fontSize="13">
              how bad × how often
            </text>
            <rect
              x="0"
              y="224"
              width="250"
              height="56"
              rx="10"
              fill="var(--brand-surface)"
              stroke="var(--brand-border-strong)"
            />
            <text x="125" y="248" textAnchor="middle" fill="var(--brand-text)">
              Days until you'll admit it
            </text>
            <text x="125" y="268" textAnchor="middle" fill="var(--brand-text-muted)" fontSize="13">
              computed from the score
            </text>
            <line
              x1="125"
              y1="78"
              x2="125"
              y2="118"
              stroke="var(--brand-text-muted)"
              strokeWidth="2"
              markerEnd="url(#cascade-arrow)"
            />
            <line
              x1="125"
              y1="180"
              x2="125"
              y2="220"
              stroke="var(--brand-text-muted)"
              strokeWidth="2"
              markerEnd="url(#cascade-arrow)"
            />
            <line
              x1="256"
              y1="150"
              x2="318"
              y2="150"
              stroke="var(--brand-danger)"
              strokeWidth="2"
              strokeDasharray="4 4"
              markerEnd="url(#cascade-arrow)"
            />
            <text x="330" y="40" fill="var(--brand-text)" fontSize="14">
              But with one form-wide store,
            </text>
            <text x="330" y="60" fill="var(--brand-text)" fontSize="14">
              every subscribed field re-renders:
            </text>
            {Array.from({ length: COUNT }, (_, i) => (
              <rect
                key={i}
                x={330 + (i % COLS) * (SIZE + GAP)}
                y={GRID_TOP + Math.floor(i / COLS) * (SIZE + GAP)}
                width={SIZE}
                height={SIZE}
                rx="2"
                fill={i < NEEDED ? "var(--brand-solid)" : "var(--brand-danger)"}
              />
            ))}
            <rect
              x="330"
              y={GRID_TOP + ROWS * (SIZE + GAP) + 8}
              width={SIZE}
              height={SIZE}
              rx="2"
              fill="var(--brand-danger)"
            />
            <text
              x="346"
              y={GRID_TOP + ROWS * (SIZE + GAP) + 18}
              fill="var(--brand-text-muted)"
              fontSize="13"
            >
              one component re-rendered
            </text>
            <rect
              x="330"
              y={GRID_TOP + ROWS * (SIZE + GAP) + 26}
              width={SIZE}
              height={SIZE}
              rx="2"
              fill="var(--brand-solid)"
            />
            <text
              x="346"
              y={GRID_TOP + ROWS * (SIZE + GAP) + 36}
              fill="var(--brand-text-muted)"
              fontSize="13"
            >
              one that actually had something new to show
            </text>
          </g>
        </svg>
        <div className={styles.stat}>
          <span className={styles.statNumber}>280</span>
          <Text variant="body-sm" tone="muted" as="span">
            re-renders from one click, on a form of 309 questions. Three of them needed to.
          </Text>
        </div>
      </div>
    </figure>
  );
}
