import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useAnchorFollows } from "./useAnchorFollows";

const HASH = "#contact";

/** A real click on a real link, so the hook's own delegate is what runs. */
function click(html: string) {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  act(() => {
    host.querySelector("a, span")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("useAnchorFollows", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("counts a link to the hash", () => {
    const { result } = renderHook(() => useAnchorFollows(HASH));
    click(`<a href="${HASH}">let me know</a>`);
    expect(result.current).toBe(1);
  });

  it("counts the same link again, which `hashchange` would not", () => {
    const { result } = renderHook(() => useAnchorFollows(HASH));
    click(`<a href="${HASH}">let me know</a>`);
    click(`<a href="${HASH}">let me know</a>`);
    expect(result.current).toBe(2);
  });

  it("counts a click on something inside the link", () => {
    const { result } = renderHook(() => useAnchorFollows(HASH));
    click(`<a href="${HASH}"><span>let me know</span></a>`);
    expect(result.current).toBe(1);
  });

  it("ignores links elsewhere", () => {
    const { result } = renderHook(() => useAnchorFollows(HASH));
    click(`<a href="#reader-contact">the other copy</a>`);
    click(`<a href="/blog/cv.html">the CV</a>`);
    expect(result.current).toBe(0);
  });
});
