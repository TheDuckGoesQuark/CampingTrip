import { describe, expect, it } from "vitest";

import { cv } from "../data/cv";
import { posts, published } from "../data/posts";
import { slugify } from "../data/slug";
import { blogPaths } from "../routing/blogPaths";
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

  it("gives the CV a profile head: a Person, and the PDF as an alternate form", () => {
    const page = render(blogPaths.cv)!;
    expect(page.head).toContain('<meta property="og:type" content="profile" />');
    expect(page.head).toContain('"@type":"ProfilePage"');
    expect(page.head).toContain(`"mainEntity":{"@type":"Person","name":"${cv.name}"`);
    expect(page.head).toContain(
      '<link rel="alternate" type="application/pdf" href="https://jordanscamp.site/cv.pdf" />',
    );
  });

  it("puts the whole CV in the static page, so the PDF and a crawler get all of it", () => {
    const { html } = render(blogPaths.cv)!;
    expect(html).toContain(cv.name);
    for (const role of cv.experience) {
      expect(html).toContain(role.org);
      for (const highlight of role.highlights) expect(html).toContain(highlight);
    }
    for (const entry of cv.education) expect(html).toContain(entry.institution);
    expect(html).toContain(`href="${blogPaths.cvPdf}"`);
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

  it("feeds every published post, newest first, with its body as HTML", () => {
    const entries = feedEntries();
    expect(entries.length).toBe(published.length);
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1].date >= entries[i].date).toBe(true);
    }
    for (const entry of entries) {
      expect(entry.html).toContain("<p>");
      expect(entry.path).toMatch(/^\/blog\/posts\/.+\.html$/);
    }
  });

  it("keeps drafts out of the feed", () => {
    const titles = feedEntries().map((entry) => entry.title);
    for (const draft of posts.filter((post) => post.draft)) {
      expect(titles).not.toContain(draft.title);
    }
  });

  it("still renders a draft when asked for it directly, for previewing in CatOS", () => {
    const draft = posts.find((post) => post.draft)!;
    const page = render(`/blog/posts/${slugify(draft.title)}.html`);
    expect(page).not.toBeNull();
  });
});
