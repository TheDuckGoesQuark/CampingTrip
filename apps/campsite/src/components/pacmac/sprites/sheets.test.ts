import { afterEach, describe, expect, it, vi } from "vitest";

import { loadSuppliedSheets } from "./sheets";

/** jsdom fetches no images, so each one's size and load are declared by the test. */
function stubImages(size: (src: string) => { width: number; height: number } | null) {
  const images: HTMLImageElement[] = [];
  vi.stubGlobal(
    "Image",
    class extends window.Image {
      constructor() {
        super();
        images.push(this);
      }
    },
  );
  return () => {
    for (const image of images) {
      const found = size(image.getAttribute("src") ?? "");
      if (!found) continue;
      Object.defineProperty(image, "naturalWidth", { value: found.width });
      Object.defineProperty(image, "naturalHeight", { value: found.height });
      image.dispatchEvent(new Event("load"));
    }
  };
}

describe("loadSuppliedSheets", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("hands over a strip that is the size its entry says", () => {
    const settle = stubImages((src) =>
      src.endsWith("/macman.png") ? { width: 144, height: 48 } : null,
    );
    const onSheet = vi.fn();
    loadSuppliedSheets(onSheet);
    settle();
    expect(onSheet).toHaveBeenCalledOnce();
    expect(onSheet).toHaveBeenCalledWith(
      "macman",
      expect.objectContaining({ frames: 3, cell: 48 }),
    );
  });

  it("keeps the placeholder for a strip of the wrong size, and says so", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const settle = stubImages((src) =>
      src.endsWith("/macman.png") ? { width: 48, height: 48 } : null,
    );
    const onSheet = vi.fn();
    loadSuppliedSheets(onSheet);
    settle();
    expect(onSheet).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("expected 144x48"));
  });

  it("drops anything that arrives after it is cancelled", () => {
    const settle = stubImages(() => ({ width: 144, height: 48 }));
    const onSheet = vi.fn();
    loadSuppliedSheets(onSheet)();
    settle();
    expect(onSheet).not.toHaveBeenCalled();
  });
});
