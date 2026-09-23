import { BrandProvider } from "@jordanscamp/ds";
import { render as renderLive } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import BlogPageView from "../components/blog/BlogPageView";
import { isBrowserPage, resolveBlogPage } from "../data/blogPages";
import { SITE_ORIGIN } from "../data/site";
import { blogPaths, parseBlogPath } from "../routing/blogPaths";
import { render } from "./entry";
import { RenderTargetContext } from "./renderTarget";

vi.mock("../audio/soundEffects", () => ({ playWindowOpen: vi.fn() }));

/**
 * Only `RenderTargetContext` can make the prerendered copy and the app's own
 * render disagree, and a component that did would pass every other test here,
 * since each of them renders one target and never both.
 */

const CV_PATHS = [blogPaths.cv, blogPaths.cvCondensed];

function liveHtml(path: string): string {
  const page = resolveBlogPage(parseBlogPath(path)!);
  if (!page || !isBrowserPage(page)) throw new Error(`${path} names no browser page`);
  const { container } = renderLive(
    <RenderTargetContext.Provider value="live">
      <MemoryRouter initialEntries={[path]}>
        <BrandProvider>
          <main id="reader">
            <BlogPageView page={page} />
          </main>
        </BrandProvider>
      </MemoryRouter>
    </RenderTargetContext.Provider>,
  );
  return container.innerHTML;
}

function parse(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  return host;
}

const textOf = (html: string) => (parse(html).textContent ?? "").replace(/\s+/g, " ").trim();

/** Two differences are meant to exist: `useDocumentId`'s anchors, and the origin
 *  the static copy carries so the printed PDF can follow an on-site link. */
const sitePath = (href: string | null) =>
  href?.startsWith(`${SITE_ORIGIN}/`) ? href.slice(SITE_ORIGIN.length) : href;

const offPageLinksOf = (html: string) =>
  [...parse(html).querySelectorAll("a")]
    .map((a) => `${sitePath(a.getAttribute("href"))} :: ${a.textContent}`)
    .filter((link) => !link.startsWith("#"));

describe("the scriptless CV against the app's own render", () => {
  it.each(CV_PATHS)("reads the same on %s", (path) => {
    expect(textOf(render(path)!.html)).toBe(textOf(liveHtml(path)));
  });

  it.each(CV_PATHS)("offers the same links off %s", (path) => {
    expect(offPageLinksOf(render(path)!.html)).toEqual(offPageLinksOf(liveHtml(path)));
  });

  it.each(CV_PATHS)("namespaces the in-page anchors of %s, and only those", (path) => {
    const staticIds = [...parse(render(path)!.html).querySelectorAll("main [id]")].map((e) => e.id);
    const liveIds = [...parse(liveHtml(path)).querySelectorAll("main [id]")].map((e) => e.id);
    expect(staticIds).toEqual(liveIds.map((id) => `reader-${id}`));
  });
});
