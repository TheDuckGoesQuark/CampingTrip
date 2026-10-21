import styles from "./deckFigure.module.css";

const ROW = 60;

/** The slide's pipeline: one fixture, one schema, swappable state layers, one set of components. */
export default function FiveArchitectures({ backends }: { backends: string[] }) {
  const top = 165 - ((backends.length - 1) * ROW) / 2 - 24;
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.diagram}
        viewBox="0 0 1100 330"
        role="img"
        aria-label="The real questionnaire passes into one canonical schema, then into swappable state layers, all rendering the same components"
      >
        <defs>
          <marker
            id="pipeline-arrow"
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
        <g fontSize="16">
          <rect
            x="0"
            y="130"
            width="190"
            height="70"
            rx="10"
            fill="var(--brand-surface)"
            stroke="var(--brand-border-strong)"
          />
          <text x="95" y="160" textAnchor="middle" fill="var(--brand-text)">
            The real questionnaire
          </text>
          <text x="95" y="182" textAnchor="middle" fill="var(--brand-text-muted)" fontSize="13">
            production fixture
          </text>
          <rect
            x="230"
            y="130"
            width="190"
            height="70"
            rx="10"
            fill="var(--brand-surface)"
            stroke="var(--brand-border-strong)"
          />
          <text x="325" y="160" textAnchor="middle" fill="var(--brand-text)">
            One canonical schema
          </text>
          <text x="325" y="182" textAnchor="middle" fill="var(--brand-text-muted)" fontSize="13">
            309 qs · 216 edit checks
          </text>
          <line
            x1="192"
            y1="165"
            x2="226"
            y2="165"
            stroke="var(--brand-text-muted)"
            strokeWidth="2"
            markerEnd="url(#pipeline-arrow)"
          />
          {backends.map((label, index) => {
            const y = top + index * ROW;
            return (
              <g key={label}>
                <line
                  x1="422"
                  y1="165"
                  x2="466"
                  y2={y + 24}
                  stroke="var(--brand-text-muted)"
                  strokeWidth="1.5"
                />
                <line
                  x1="812"
                  y1={y + 24}
                  x2="876"
                  y2="165"
                  stroke="var(--brand-text-muted)"
                  strokeWidth="1.5"
                />
                <rect
                  x="470"
                  y={y}
                  width="340"
                  height="48"
                  rx="10"
                  fill="var(--brand-surface)"
                  stroke="var(--brand-border-strong)"
                />
                <text x="640" y={y + 30} textAnchor="middle" fill="var(--brand-text)">
                  {label}
                </text>
              </g>
            );
          })}
          <rect
            x="880"
            y="130"
            width="220"
            height="70"
            rx="10"
            fill="var(--brand-surface)"
            stroke="var(--brand-border-strong)"
          />
          <text x="990" y="160" textAnchor="middle" fill="var(--brand-text)">
            Same components
          </text>
          <text x="990" y="182" textAnchor="middle" fill="var(--brand-text-muted)" fontSize="13">
            identical DOM every time
          </text>
        </g>
      </svg>
    </figure>
  );
}
