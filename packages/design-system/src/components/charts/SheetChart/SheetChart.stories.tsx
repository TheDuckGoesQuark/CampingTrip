import type { Meta, StoryObj } from "@storybook/react-vite";

import { SheetChart, type SheetChartCategory, type SheetChartMetric } from "./SheetChart";

const meta: Meta<typeof SheetChart> = {
  title: "Charts/SheetChart",
  component: SheetChart,
};
export default meta;
type Story = StoryObj<typeof SheetChart>;

const categories: SheetChartCategory[] = [
  { id: "old", label: "Old", tone: "danger" },
  { id: "middle", label: "Middle" },
  { id: "new", label: "New", tone: "accent" },
];

const seconds: SheetChartMetric = {
  id: "time",
  label: "Time taken",
  values: [12.4, 3.1, 0.8],
  steps: [
    { label: "small", values: [1.1, 0.9, 0.4] },
    { label: "medium", values: [4.2, 1.8, 0.6] },
    { label: "large", values: [12.4, 3.1, 0.8] },
  ],
  format: (value) => `${value.toFixed(1)} s`,
};

const count: SheetChartMetric = {
  id: "count",
  label: "Requests",
  values: [840, 220, 12],
  format: (value) => value.toLocaleString("en-GB"),
};

export const Default: Story = {
  args: { title: "Results.xls", categories, metrics: [seconds] },
};

/** Every tone, several sheet tabs, and a caption. */
export const AllVariants: Story = {
  args: {
    title: "Results.xls",
    categories,
    metrics: [seconds, count],
    caption: "Lower is better on both sheets.",
  },
};
