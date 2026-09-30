import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MonitorGraph } from "./MonitorGraph";

const bars = (graph: HTMLElement) => [...graph.querySelectorAll("rect")].slice(1);

describe("MonitorGraph", () => {
  it("is an image with the label as its whole description", () => {
    render(<MonitorGraph label="Three quiet days" values={[1, 2, 3]} />);
    expect(screen.getByRole("img", { name: "Three quiet days" })).toBeInTheDocument();
  });

  it("draws one bar per value, the largest reaching the top", () => {
    render(<MonitorGraph label="g" values={[1, 4, 2]} />);
    const drawn = bars(screen.getByRole("img"));
    expect(drawn).toHaveLength(3);
    const heights = drawn.map((bar) => Number(bar.getAttribute("height")));
    expect(Math.max(...heights)).toBe(heights[1]);
    expect(heights[0]).toBeCloseTo(heights[1] / 4);
  });

  it("fills from the right when there are fewer values than slots", () => {
    render(<MonitorGraph label="g" values={[5]} slots={4} />);
    const [only] = bars(screen.getByRole("img"));
    expect(Number(only.getAttribute("x"))).toBeGreaterThan(200 * 0.7);
  });

  it("draws a stepped line, two points per value", () => {
    render(<MonitorGraph label="g" kind="line" values={[1, 2, 3]} max={4} />);
    const line = screen.getByRole("img").querySelector("polyline");
    expect(line?.getAttribute("points")?.split(" ")).toHaveLength(6);
  });

  it("copes with nothing to show and with all zeros", () => {
    render(<MonitorGraph label="empty" values={[]} slots={14} />);
    expect(bars(screen.getByRole("img", { name: "empty" }))).toHaveLength(0);
    render(<MonitorGraph label="flat" values={[0, 0]} />);
    for (const bar of bars(screen.getByRole("img", { name: "flat" }))) {
      expect(bar.getAttribute("height")).toBe("0");
    }
  });
});
