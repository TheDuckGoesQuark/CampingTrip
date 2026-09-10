import { BrandProvider } from "@jordanscamp/ds";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import BlogPageView from "../components/blog/BlogPageView";
import { type BrowserPage, isBrowserPage, resolveBlogPage } from "../data/blogPages";
import { parseBlogPath } from "../routing/blogPaths";
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

/** Every attribute whose value is an id, or a space-separated list of them. */
const ID_REFS = ["aria-labelledby", "aria-describedby", "aria-controls", "aria-owns", "for"];

const REF_SELECTOR = ID_REFS.map((attr) => `[${attr}]`).join(", ");

/**
 * Which ids an element points at, however it points: an `href="#…"` and an
 * `aria-labelledby` are the same question asked twice.
 */
function referencedIds(el: Element): string[] {
  const ids = ID_REFS.flatMap((attr) => (el.getAttribute(attr) ?? "").split(/\s+/));
  const href = el.getAttribute("href");
  if (href?.startsWith("#")) ids.push(decodeURIComponent(href.slice(1)));
  return ids.filter(Boolean);
}

/**
 * True for an id the live app can never mint, so a reference carrying it can
 * only land in the prerendered reader: `useDocumentId`'s prefix, or React's own
 * `_R_…` server space (a client root mints `_r_…` instead — see `mountId`).
 */
function readerNamespaced(id: string): boolean {
  return id.startsWith("reader-") || id.startsWith("_R_");
}

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

  it("namespaces every in-page link, so it cannot resolve to the hidden copy", () => {
    for (const { path, html } of pages()) {
      const root = parse(html);
      for (const link of root.querySelectorAll('a[href^="#"]')) {
        const id = decodeURIComponent(link.getAttribute("href")!.slice(1));
        expect(root.querySelector(`[id="${id}"]`), `${path}: #${id} has no target`).not.toBeNull();
        expect(readerNamespaced(id), `${path}: #${id} is not namespaced to the reader`).toBe(true);
      }
    }
  });

  it("namespaces every id the reader declares, so the live copy owns its own", () => {
    for (const { path, html } of pages()) {
      // `#reader` is the wrapper the app hides, not a page's own id.
      const ids = [...parse(html).querySelectorAll("[id]")]
        .map((el) => el.id)
        .filter((id) => id !== "reader");
      for (const id of ids) {
        expect(readerNamespaced(id), `${path}: #${id}`).toBe(true);
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

/**
 * The built page carries both renders at once: the prerendered `#reader`, which
 * `index.html` only hides (printing needs it), and the live app beside it. So
 * every id a page declares exists twice, and `document.getElementById` answers
 * with whichever comes first in document order — the reader's, always. These
 * assemble the pair the way the browser does and check that no reference
 * crosses between them.
 *
 * The landing page has no live counterpart worth building here: its live half
 * is the 3D scene, and its reader declares no ids.
 */
describe("the reader and the live app side by side", () => {
  function blogPages(): { path: string; html: string; page: BrowserPage }[] {
    return blogUrls().map((path) => {
      const ref = parseBlogPath(path)!;
      const page = resolveBlogPage(ref)!;
      if (!isBrowserPage(page)) throw new Error(`${path} is not a browser page`);
      return { path, html: render(path)!.html, page };
    });
  }

  async function assemble(html: string, page: BrowserPage): Promise<() => void> {
    document.body.innerHTML = `${html}<div id="root"></div>`;
    const root = createRoot(document.getElementById("root")!);
    await act(async () => {
      root.render(
        <BrowserRouter>
          <BrandProvider>
            <BlogPageView page={page} />
          </BrandProvider>
        </BrowserRouter>,
      );
    });
    return () => {
      act(() => root.unmount());
      document.body.innerHTML = "";
    };
  }

  it("declares no id twice", async () => {
    for (const { path, html, page } of blogPages()) {
      const teardown = await assemble(html, page);
      const seen = new Map<string, number>();
      for (const el of document.querySelectorAll("[id]")) {
        seen.set(el.id, (seen.get(el.id) ?? 0) + 1);
      }
      const twice = [...seen].filter(([, n]) => n > 1).map(([id]) => id);
      expect(twice, path).toEqual([]);
      teardown();
    }
  });

  it("keeps every id reference on its own side of the reader", async () => {
    for (const { path, html, page } of blogPages()) {
      const teardown = await assemble(html, page);
      const reader = document.getElementById("reader")!;
      for (const el of document.querySelectorAll(`${REF_SELECTOR}, a[href^="#"]`)) {
        for (const id of referencedIds(el)) {
          const target = document.getElementById(id);
          expect(
            target,
            `${path}: ${el.tagName} points at #${id}, which is not on the page`,
          ).not.toBeNull();
          expect(
            reader.contains(target),
            `${path}: a reference to #${id} from the ${reader.contains(el) ? "reader" : "live app"} crosses into the other half`,
          ).toBe(reader.contains(el));
        }
      }
      teardown();
    }
  });
});
