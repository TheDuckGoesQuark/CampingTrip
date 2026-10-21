import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SheetChart, type SheetChartMetric } from "./SheetChart";

const categories = [
  { id: "a", label: "Alpha", tone: "danger" as const },
  { id: "b", label: "Beta", tone: "accent" as const },
];

const metrics: SheetChartMetric[] = [
  { id: "time", label: "Time", values: [12, 3], format: (value) => `${value} s` },
  { id: "count", label: "Count", values: [800, 20], format: (value) => `${value} renders` },
];

describe("SheetChart", () => {
  it("shows the first sheet's figures as a legend table", () => {
    render(<SheetChart title="Results" categories={categories} metrics={metrics} />);
    const table = screen.getByRole("table", { name: "Time" });
    expect(table).toHaveTextContent("Alpha12 s");
    expect(table).toHaveTextContent("Beta3 s");
  });

  it("switches sheet when another tab is chosen", async () => {
    render(<SheetChart title="Results" categories={categories} metrics={metrics} />);
    await userEvent.click(screen.getByRole("tab", { name: "Count" }));
    expect(screen.getByRole("tab", { name: "Count" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("table", { name: "Count" })).toHaveTextContent("Alpha800 renders");
  });

  it("keeps the chosen view when the sheet changes", async () => {
    const stepped = metrics.map((metric) => ({
      ...metric,
      steps: [
        { label: "1x", values: [1, 1] },
        { label: "2x", values: metric.values },
      ],
    }));
    render(<SheetChart title="Results" categories={categories} metrics={stepped} />);
    await userEvent.click(screen.getByRole("button", { name: "Lines" }));
    await userEvent.click(screen.getByRole("tab", { name: "Count" }));
    expect(screen.getByRole("button", { name: "Lines" })).toHaveAttribute("aria-pressed", "true");
  });

  it("names its tab list after the title", () => {
    render(<SheetChart title="Results" categories={categories} metrics={metrics} />);
    expect(screen.getByRole("tablist", { name: "Results" })).toBeInTheDocument();
  });

  it("renders nothing without a metric", () => {
    const { container } = render(
      <SheetChart title="Results" categories={categories} metrics={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
