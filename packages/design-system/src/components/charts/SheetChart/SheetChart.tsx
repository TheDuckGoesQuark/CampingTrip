import { cva } from "class-variance-authority";
import { type ReactNode, useState } from "react";
import {
  Bar,
  BarChart,
  type BarShapeProps,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Tabs } from "../../../primitives/Tabs";
import { Text } from "../../Text";

import styles from "./SheetChart.module.css";

const tone = cva("", {
  variants: {
    tone: { default: styles.toneDefault, accent: styles.toneAccent, danger: styles.toneDanger },
  },
  defaultVariants: { tone: "default" },
});

export type SheetChartTone = "default" | "accent" | "danger";

export interface SheetChartCategory {
  id: string;
  label: string;
  /** The x-axis text, where the label is too long to sit beside its neighbours. The legend keeps `label`. */
  short?: string;
  /** `accent` for the one the chart is about, `danger` for the one it warns against. */
  tone?: SheetChartTone;
}

export interface SheetChartStep {
  /** The x-axis label: a size, a date, a version. */
  label: string;
  /** One per category, in the categories' order. */
  values: number[];
}

export interface SheetChartMetric {
  id: string;
  label: string;
  /** The sheet tab's text, when the label is too long for one. */
  tab?: string;
  /** One per category, in the categories' order: the bars, and the legend's figures. */
  values: number[];
  /** The same measure taken at several points; given, the sheet offers a line view across them. */
  steps?: SheetChartStep[];
  format: (value: number) => string;
}

export interface SheetChartProps {
  /** The window's title, and the tab list's accessible name. */
  title: string;
  categories: SheetChartCategory[];
  /** One sheet tab each, along the bottom. */
  metrics: SheetChartMetric[];
  caption?: ReactNode;
}

type View = "bars" | "lines";

interface Row extends SheetChartCategory {
  axis: string;
  value: number;
}

/** How far the bar's top and side are extruded, in SVG units. */
const DEPTH = 5;

/** A face with a lit top and a shaded side: the period's 3D bar, flush with the axis. */
function ToneBar({ x = 0, y = 0, width = 0, height = 0, payload }: BarShapeProps) {
  const row = payload as Row;
  const fill = tone({ tone: row.tone });
  const right = x + width;
  const bottom = y + height;
  const top = `${x},${y} ${x + DEPTH},${y - DEPTH} ${right + DEPTH},${y - DEPTH} ${right},${y}`;
  const side = `${right},${y} ${right + DEPTH},${y - DEPTH} ${right + DEPTH},${bottom} ${right},${bottom}`;
  return (
    <g className={`${styles.bar} ${fill}`}>
      <polygon points={top} />
      <polygon className={styles.lit} points={top} />
      <polygon points={side} />
      <polygon className={styles.shaded} points={side} />
      <rect x={x} y={y} width={width} height={height} />
    </g>
  );
}

function Bars({
  metric,
  categories,
}: {
  metric: SheetChartMetric;
  categories: SheetChartCategory[];
}) {
  const rows: Row[] = categories.map((category, index) => ({
    ...category,
    axis: category.short ?? category.label,
    value: metric.values[index] ?? 0,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height: 280 }}>
      <BarChart
        data={rows}
        margin={{ top: 28, right: 16, bottom: 4, left: 0 }}
        barCategoryGap="35%"
      >
        <CartesianGrid className={styles.grid} vertical={false} />
        <XAxis dataKey="axis" className={styles.axis} tickLine={false} interval={0} />
        <YAxis className={styles.axis} tickFormatter={metric.format} width={72} />
        <Bar dataKey="value" isAnimationActive={false} shape={ToneBar} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Lines({
  steps,
  metric,
  categories,
}: {
  steps: SheetChartStep[];
  metric: SheetChartMetric;
  categories: SheetChartCategory[];
}) {
  const rows = steps.map((step) => ({
    label: step.label,
    ...Object.fromEntries(
      categories.map((category, index) => [category.id, step.values[index] ?? 0]),
    ),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height: 280 }}>
      <LineChart data={rows} margin={{ top: 28, right: 24, bottom: 4, left: 0 }}>
        <CartesianGrid className={styles.grid} vertical={false} />
        <XAxis dataKey="label" className={styles.axis} tickLine={false} interval={0} />
        <YAxis className={styles.axis} tickFormatter={metric.format} width={72} />
        {categories.map((category) => (
          <Line
            key={category.id}
            dataKey={category.id}
            type="monotone"
            className={`${styles.line} ${tone({ tone: category.tone })}`}
            dot={{ r: 4, className: `${styles.marker} ${tone({ tone: category.tone })}` }}
            activeDot={false}
            isAnimationActive={false}
            stroke=""
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface SheetProps {
  metric: SheetChartMetric;
  categories: SheetChartCategory[];
  view: View;
  onViewChange: (view: View) => void;
}

function Sheet({ metric, categories, view, onViewChange }: SheetProps) {
  const steps = metric.steps;
  const last = steps?.at(-1)?.label;

  return (
    <>
      <div className={styles.sheetHeader}>
        <Text variant="label" as="p">
          {metric.label}
        </Text>
        {steps === undefined ? null : (
          <div className={styles.views} role="group" aria-label="Chart view">
            <button
              type="button"
              className={styles.view}
              aria-pressed={view === "bars"}
              onClick={() => onViewChange("bars")}
            >
              Bars
            </button>
            <button
              type="button"
              className={styles.view}
              aria-pressed={view === "lines"}
              onClick={() => onViewChange("lines")}
            >
              Lines
            </button>
          </div>
        )}
      </div>
      {/* The legend below carries every figure as text, so the drawing is hidden from it. */}
      <div className={styles.plot} aria-hidden="true">
        {steps !== undefined && view === "lines" ? (
          <Lines steps={steps} metric={metric} categories={categories} />
        ) : (
          <Bars metric={metric} categories={categories} />
        )}
      </div>
      <table className={styles.legend}>
        <caption className={styles.visuallyHidden}>
          {metric.label}
          {last === undefined ? "" : ` at ${last}`}
        </caption>
        <tbody>
          {categories.map((category, index) => (
            <tr key={category.id}>
              <th scope="row">
                <span className={`${styles.swatch} ${tone({ tone: category.tone })}`} />
                {category.label}
              </th>
              <td>{metric.format(metric.values[index] ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/**
 * A 1995 spreadsheet's chart window: bevelled, a grey plot area, one sheet tab
 * per metric, the figures in a legend table pinned top right, and a bars or
 * lines view wherever a metric was taken at more than one point.
 */
/* One view for the whole window: the choice survives a change of sheet. */
export function SheetChart({ title, categories, metrics, caption }: SheetChartProps) {
  const [view, setView] = useState<View>("bars");
  const first = metrics[0];
  if (first === undefined) return null;

  return (
    <figure className={styles.window}>
      <div className={styles.titleBar}>
        <Text variant="label" as="span">
          {title}
        </Text>
      </div>
      <Tabs.Root defaultValue={first.id} className={styles.book}>
        {metrics.map((metric) => (
          <Tabs.Panel key={metric.id} value={metric.id} className={styles.sheet}>
            <Sheet metric={metric} categories={categories} view={view} onViewChange={setView} />
          </Tabs.Panel>
        ))}
        <Tabs.List className={styles.tabs} aria-label={title}>
          {metrics.map((metric) => (
            <Tabs.Tab key={metric.id} value={metric.id} className={styles.tab}>
              {metric.tab ?? metric.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
      {caption === undefined ? null : (
        <figcaption className={styles.caption}>
          <Text variant="body-sm" tone="muted" as="span">
            {caption}
          </Text>
        </figcaption>
      )}
    </figure>
  );
}
