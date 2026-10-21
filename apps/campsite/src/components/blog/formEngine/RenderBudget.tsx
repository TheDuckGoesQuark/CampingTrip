import { useEffect, useRef, useState } from "react";

import styles from "./RenderBudget.module.css";

/** Render time climbing PR by PR, ending exactly where it crosses the budget line. */
const CURVE = "M 60 230 C 300 226, 440 180, 520 100";
const BUDGET_Y = 100;
const CROSS_X = 520;
const TRAVEL_MS = 4200;
const HOLD_MS = 3500;

type Phase = "idle" | "travelling" | "rejected";

export default function RenderBudget() {
  const [phase, setPhase] = useState<Phase>("idle");
  const figure = useRef<HTMLElement>(null);
  const motion = useRef<SVGAnimateMotionElement>(null);
  const visible = useRef(false);

  useEffect(() => {
    const node = figure.current;
    if (node === null) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry?.isIntersecting ?? false;
        if (visible.current) setPhase((current) => (current === "idle" ? "travelling" : current));
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (phase === "travelling") {
      motion.current?.beginElement();
      const timer = window.setTimeout(() => setPhase("rejected"), TRAVEL_MS);
      return () => window.clearTimeout(timer);
    }
    if (phase === "rejected") {
      const timer = window.setTimeout(() => {
        setPhase(visible.current ? "travelling" : "idle");
      }, HOLD_MS);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [phase]);

  const rejected = phase === "rejected";

  return (
    <figure className={styles.figure} ref={figure} data-phase={phase}>
      <svg
        className={styles.graph}
        viewBox="0 0 600 270"
        role="img"
        aria-label="Render time creeping up over a series of pull requests until it crosses the budget line, where the check fails and the pull request is rejected"
      >
        <defs>
          <marker
            id="budget-arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,10 L5,0 L10,10 z" fill="var(--brand-text-muted)" />
          </marker>
        </defs>
        <line
          x1="60"
          y1="240"
          x2="60"
          y2="30"
          stroke="var(--brand-text-muted)"
          strokeWidth="1.5"
          markerEnd="url(#budget-arrow)"
        />
        <line
          x1="60"
          y1="240"
          x2="570"
          y2="240"
          stroke="var(--brand-text-muted)"
          strokeWidth="1.5"
        />
        <text
          x="20"
          y="140"
          fill="var(--brand-text-muted)"
          fontSize="13"
          transform="rotate(-90 20 140)"
          textAnchor="middle"
        >
          slowest render
        </text>
        <text x="315" y="262" fill="var(--brand-text-muted)" fontSize="13" textAnchor="middle">
          one PR after another
        </text>
        <line
          x1="60"
          y1={BUDGET_Y}
          x2="570"
          y2={BUDGET_Y}
          stroke="var(--brand-danger)"
          strokeWidth="1.5"
          strokeDasharray="6 5"
        />
        <text x="566" y={BUDGET_Y - 8} fill="var(--brand-danger)" fontSize="13" textAnchor="end">
          200 ms budget
        </text>
        <path
          d={CURVE}
          fill="none"
          stroke="var(--brand-text-muted)"
          strokeWidth="2"
          className={styles.curve}
        />
        <g className={styles.verdict} data-shown={rejected || undefined}>
          <line
            x1={CROSS_X}
            y1={BUDGET_Y}
            x2={CROSS_X}
            y2="240"
            stroke="var(--brand-danger)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <rect
            x={CROSS_X - 62}
            y="206"
            width="104"
            height="24"
            rx="4"
            fill="var(--brand-danger)"
          />
          <text
            x={CROSS_X - 10}
            y="222"
            fill="var(--brand-text-on-brand)"
            fontSize="13"
            fontWeight="700"
            textAnchor="middle"
          >
            PR rejected
          </text>
        </g>
        <circle
          r="7"
          fill="var(--brand-solid)"
          stroke="var(--brand-surface)"
          strokeWidth="2"
          className={styles.dot}
        >
          <animateMotion
            ref={motion}
            dur={`${TRAVEL_MS}ms`}
            begin="indefinite"
            fill="freeze"
            path={CURVE}
          />
        </circle>
      </svg>
    </figure>
  );
}
