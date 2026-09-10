import { describe, expect, it } from "vitest";

import { blogUrls, render, renderLanding } from "./entry";

/**
 * Structural rules the linter cannot reach. `jsx-a11y` reads one element at a
 * time, so it catches a missing `alt` but never a heading that skips a level or
 * a `ul` full of `div`s — those are facts about a whole document. Asserted on
 * the prerendered HTML, so it is the markup as shipped.
 */

function pages(): { path: string; html: string }[] {
  return [
    { path: "/", html: renderLanding().html },
    ...blogUrls().map((path) => ({ path, html: render(path)!.html })),
  ];
}

function parse(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  return host;
}

const HEADINGS = "h1, h2, h3, h4, h5, h6";

describe("prerendered page structure", () => {
  it("gives every page exactly one h1", () => {
    for (const { path, html } of pages()) {
      const h1s = [...parse(html).querySelectorAll("h1")].map((h) => h.textContent);
      expect(h1s, path).toHaveLength(1);
    }
  });

  it("never skips a heading level", () => {
    for (const { path, html } of pages()) {
      const levels = [...parse(html).querySelectorAll(HEADINGS)].map((h) => Number(h.tagName[1]));
      levels.forEach((level, i) => {
        if (i === 0) return;
        // Going back up any number of levels is fine; only stepping down by more
        // than one leaves a gap a reader navigating by heading would fall into.
        expect(level - levels[i - 1], `${path}: ${levels.join(" → ")}`).toBeLessThanOrEqual(1);
      });
    }
  });

  it("puts nothing but list items directly inside a list", () => {
    for (const { path, html } of pages()) {
      for (const list of parse(html).querySelectorAll("ul, ol")) {
        const stray = [...list.children].map((c) => c.tagName).filter((t) => t !== "LI");
        expect(stray, `${path}: <${list.tagName.toLowerCase()}>`).toEqual([]);
      }
    }
  });

  it("puts a dt and a dd in every description list", () => {
    for (const { path, html } of pages()) {
      for (const list of parse(html).querySelectorAll("dl")) {
        expect(list.querySelectorAll("dt").length, path).toBeGreaterThan(0);
        expect(list.querySelectorAll("dt").length, path).toBe(list.querySelectorAll("dd").length);
      }
    }
  });

  it("gives every image an alt attribute, empty or otherwise", () => {
    for (const { path, html } of pages()) {
      for (const img of parse(html).querySelectorAll("img")) {
        expect(img.hasAttribute("alt"), `${path}: ${img.getAttribute("src")}`).toBe(true);
      }
    }
  });

  it("has one main landmark per page, and never nests them", () => {
    for (const { path, html } of pages()) {
      const mains = parse(html).querySelectorAll("main");
      expect(mains, path).toHaveLength(1);
      expect(mains[0].querySelector("main"), path).toBeNull();
    }
  });

  it("resolves every aria-labelledby to an element on the page", () => {
    for (const { path, html } of pages()) {
      const root = parse(html);
      for (const el of root.querySelectorAll("[aria-labelledby]")) {
        for (const id of el.getAttribute("aria-labelledby")!.split(/\s+/)) {
          expect(root.querySelector(`[id="${id}"]`), `${path}: ${id}`).not.toBeNull();
        }
      }
    }
  });

  it("resolves every in-page link to a target on the same page", () => {
    for (const { path, html } of pages()) {
      const root = parse(html);
      const fragments = [...root.querySelectorAll('a[href^="#"]')].map(
        (a) => a.getAttribute("href")!,
      );
      for (const href of fragments) {
        const id = href.slice(1);
        expect(root.querySelector(`[id="${id}"]`), `${path}: ${href}`).not.toBeNull();
      }
    }
  });

  // Why the prefix: `useDocumentId` in `renderTarget.ts`.
  it("namespaces every in-page link, so it cannot resolve to the hidden copy", () => {
    for (const { path, html } of pages()) {
      for (const a of parse(html).querySelectorAll('a[href^="#"]')) {
        expect(a.getAttribute("href"), `${path}: ${a.textContent}`).toMatch(/^#reader-/);
      }
    }
  });

  it("names every nav, so two on a page can be told apart", () => {
    for (const { path, html } of pages()) {
      for (const nav of parse(html).querySelectorAll("nav")) {
        const named = nav.hasAttribute("aria-label") || nav.hasAttribute("aria-labelledby");
        expect(named, `${path}: <nav> with no accessible name`).toBe(true);
      }
    }
  });

  it("offers a still image to anyone who asked for less motion", () => {
    // Also proves the parser reads React's `srcSet` back as `srcset`.
    const source = parse(render("/blog/index.html")!.html).querySelector("picture source")!;
    expect(source.getAttribute("media")).toBe("(prefers-reduced-motion: reduce)");
    expect((source as HTMLSourceElement).srcset).toMatch(/pixel-cat-still\.webp$/);
  });

  it("marks every date the blog renders as a machine-readable time", () => {
    const root = parse(render("/blog/posts/index.html")!.html);
    const times = [...root.querySelectorAll("time")];
    expect(times.length).toBeGreaterThan(0);
    for (const time of times) {
      expect(time.getAttribute("datetime"), time.textContent ?? "").toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
