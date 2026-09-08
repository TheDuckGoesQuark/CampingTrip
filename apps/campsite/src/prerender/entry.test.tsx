import { describe, expect, it } from "vitest";

import { blogUrls, feedEntries, render, renderLanding } from "./entry";

describe("prerender entry", () => {
  it("renders every blog URL to a page with its own head", () => {
    for (const url of blogUrls()) {
      const page = render(url);
      expect(page, url).not.toBeNull();
      expect(page!.html, url).toContain('<main id="reader">');
      expect(page!.head, url).toContain(
        `<link rel="canonical" href="https://jordanscamp.site${url}" />`,
      );
      expect(page!.head, url).toMatch(/<title>.+<\/title>/);
    }
  });

  it("gives a post an article head with its standfirst as the description", () => {
    const page = render("/blog/posts/what-vibe-coding-actually-changed.html")!;
    expect(page.head).toContain('<meta property="og:type" content="article" />');
    expect(page.head).toContain(
      '<meta name="description" content="I expected to miss trawling the docs. Reader, I do not." />',
    );
    expect(page.head).toContain('"@type":"BlogPosting"');
    expect(page.head).toContain('"headline":"What vibe coding actually changed"');
  });

  it("renders an island's fallback rather than its component", () => {
    const page = render("/blog/posts/what-vibe-coding-actually-changed.html")!;
    expect(page.html).toContain("counts your clicks");
    expect(page.html).not.toContain("Click me");
  });

  it("returns null for a path that names no page", () => {
    expect(render("/blog/posts/nothing-here.html")).toBeNull();
    expect(render("/blog")).toBeNull();
    expect(render("/blog/desk/bin")).toBeNull();
  });

  it("renders the landing page with links into the blog", () => {
    const page = renderLanding();
    expect(page.head).toContain("<title>Jordan&#x27;s Campsite</title>".replace("&#x27;", "'"));
    expect(page.html).toContain('href="/blog/index.html"');
    expect(page.html).toContain('href="/blog/posts/index.html"');
  });

  it("feeds every post, newest first, with its body as HTML", () => {
    const entries = feedEntries();
    expect(entries.length).toBeGreaterThan(0);
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1].date >= entries[i].date).toBe(true);
    }
    expect(entries[0].html).toContain("<p>");
    expect(entries[0].path).toMatch(/^\/blog\/posts\/.+\.html$/);
  });
});
