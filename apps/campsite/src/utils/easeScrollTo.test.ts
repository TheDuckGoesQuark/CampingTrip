import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { easeInOut, easeScrollTo, scrollParentOf } from "./easeScrollTo";

/** jsdom lays nothing out, so the geometry is declared. */
function frame({ height, contentHeight }: { height: number; contentHeight: number }) {
  const parent = document.createElement("div");
  parent.style.overflowY = "auto";
  Object.defineProperty(parent, "clientHeight", { value: height });
  Object.defineProperty(parent, "scrollHeight", { value: contentHeight });
  parent.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
  // jsdom has no `scrollTo` on an element; scrolling is what the animation is measured by.
  parent.scrollTo = ((options: ScrollToOptions) => {
    parent.scrollTop = options.top ?? 0;
  }) as typeof parent.scrollTo;
  const target = document.createElement("section");
  target.getBoundingClientRect = () => ({ top: 100 + 2000 - parent.scrollTop }) as DOMRect;
  parent.append(target);
  document.body.append(parent);
  return { parent, target };
}

describe("easeInOut", () => {
  it("starts at rest, ends at rest, and is symmetric about the middle", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(0.25)).toBeCloseTo(1 - easeInOut(0.75));
  });

  it("never goes backwards", () => {
    let last = 0;
    for (let t = 0; t <= 1; t += 0.05) {
      expect(easeInOut(t)).toBeGreaterThanOrEqual(last);
      last = easeInOut(t);
    }
  });
});

describe("scrollParentOf", () => {
  it("finds the nearest ancestor that scrolls", () => {
    const { parent, target } = frame({ height: 500, contentHeight: 3000 });
    expect(scrollParentOf(target)).toBe(parent);
  });

  it("falls back to the document when nothing between scrolls", () => {
    const target = document.createElement("section");
    document.body.append(target);
    expect(scrollParentOf(target)).toBe(document.scrollingElement ?? document.documentElement);
  });
});

describe("easeScrollTo", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("lands the target at the top of its frame, under the frame's scroll inset", async () => {
    const { parent, target } = frame({ height: 500, contentHeight: 3000 });
    parent.style.scrollPaddingTop = "24px";
    target.style.scrollMarginTop = "16px";
    const landing = easeScrollTo(target);
    vi.advanceTimersByTime(2000);
    await expect(landing).resolves.toBe(true);
    expect(parent.scrollTop).toBe(2000 - 24 - 16);
  });

  it("passes through the middle on its way, rather than jumping", async () => {
    const { parent, target } = frame({ height: 500, contentHeight: 3000 });
    const landing = easeScrollTo(target);
    vi.advanceTimersByTime(16);
    const early = parent.scrollTop;
    vi.advanceTimersByTime(300);
    const midway = parent.scrollTop;
    expect(early).toBeLessThan(midway);
    expect(midway).toBeLessThan(2000);
    vi.advanceTimersByTime(2000);
    await expect(landing).resolves.toBe(true);
  });

  it("jumps straight there when asked for no motion", async () => {
    const { parent, target } = frame({ height: 500, contentHeight: 3000 });
    await expect(easeScrollTo(target, { instant: true })).resolves.toBe(true);
    expect(parent.scrollTop).toBe(2000);
  });

  it("stops short of the end of the content", async () => {
    const { parent, target } = frame({ height: 500, contentHeight: 2200 });
    await easeScrollTo(target, { instant: true });
    expect(parent.scrollTop).toBe(2200 - 500);
  });

  it("gives the scroll back to a visitor who takes it mid-journey", async () => {
    const { parent, target } = frame({ height: 500, contentHeight: 3000 });
    const landing = easeScrollTo(target);
    vi.advanceTimersByTime(100);
    const whenTaken = parent.scrollTop;
    parent.dispatchEvent(new Event("wheel"));
    vi.advanceTimersByTime(2000);
    await expect(landing).resolves.toBe(false);
    expect(parent.scrollTop).toBe(whenTaken);
  });
});
