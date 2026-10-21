import type { SheetChartCategory, SheetChartMetric, SheetChartStep } from "@jordanscamp/ds";

/** Medians of three runs, at one, two and four times the questionnaire (309, 618 and 1,236 questions). */

const SCALES = ["1×", "2×", "4×"];

function ms(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`;
}

function count(value: number): string {
  return value.toLocaleString("en-GB");
}

function keystroke(value: number): string {
  return `${value.toFixed(1)} ms`;
}

/** `byScale` is one row per scale, each a value per category; the bars show the largest scale. */
function metric(
  id: string,
  label: string,
  tab: string,
  format: (value: number) => string,
  byScale: number[][],
): SheetChartMetric {
  const steps: SheetChartStep[] = byScale.map((values, index) => ({
    label: SCALES[index] ?? "",
    values,
  }));
  return { id, label, tab, format, values: byScale[byScale.length - 1] ?? [], steps };
}

export const libraryCategories: SheetChartCategory[] = [
  { id: "rhf", label: "react-hook-form", tone: "danger" },
  { id: "tanstack", label: "TanStack Form", tone: "accent" },
  { id: "jotai", label: "Jotai" },
];

export const libraryMetrics: SheetChartMetric[] = [
  metric("open", "Time to open", "Open", ms, [
    [612, 241, 191],
    [3761, 460, 272],
    [29_184, 1248, 469],
  ]),
  metric("hide", "Time to hide a section", "Hide section", ms, [
    [531, 452, 445],
    [702, 467, 441],
    [1389, 487, 446],
  ]),
  metric("key", "Time per keystroke", "Keypress", keystroke, [
    [18.1, 7.2, 7.2],
    [8.2, 6.3, 18.6],
    [84.8, 9.1, 75.9],
  ]),
  metric("click", "Components woken per click", "Click", count, [
    [280, 5, 276],
    [537, 5, 533],
    [859, 5, 1041],
  ]),
];

export const graphCategories: SheetChartCategory[] = [
  { id: "graph", label: "With the dependency graph", tone: "accent" },
  { id: "control", label: "Without it (control)", tone: "danger" },
];

export const graphMetrics: SheetChartMetric[] = [
  metric("open", "Time to open", "Open", ms, [
    [157, 148],
    [174, 181],
    [253, 257],
  ]),
  metric("hide", "Time to hide a section", "Hide section", ms, [
    [444, 463],
    [448, 479],
    [460, 501],
  ]),
  metric("key", "Time per keystroke", "Keypress", keystroke, [
    [8.6, 6.6],
    [7.3, 9.9],
    [6.2, 19.6],
  ]),
  metric("click", "Components woken per click", "Click", count, [
    [14, 1236],
    [14, 2472],
    [14, 4944],
  ]),
];
