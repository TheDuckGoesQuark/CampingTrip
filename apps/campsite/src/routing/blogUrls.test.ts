import { describe, expect, it } from "vitest";

import { resolveBlogPage } from "../data/blogPages";
import { posts, published } from "../data/posts";
import { slugify } from "../data/slug";
import { blogPathFor, blogPaths, parseBlogPath } from "./blogPaths";
import { blogUrls } from "./blogUrls";

describe("blogUrls", () => {
  const urls = blogUrls();

  it("names only pages that exist, each in canonical form", () => {
    for (const url of urls) {
      const ref = parseBlogPath(url);
      expect(ref, url).not.toBeNull();
      expect(blogPathFor(ref!), url).toBe(url);
      expect(resolveBlogPage(ref!), url).not.toBeNull();
    }
  });

  it("names every kind of browser page that has published content, and no desktop item", () => {
    const kinds = new Set(urls.map((url) => parseBlogPath(url)!.kind));
    const expected = new Set(["home", "archive", "cv", "project", "tool"]);
    if (published.length > 0) expected.add("post").add("tag");
    expect(kinds).toEqual(expected);
  });

  it("leaves drafts out, and any tag only drafts carry", () => {
    const drafts = posts.filter((post) => post.draft);
    expect(drafts.length).toBeGreaterThan(0);
    for (const draft of drafts) {
      expect(urls).not.toContain(blogPaths.post(slugify(draft.title)));
    }
    const publishedTags = new Set(published.flatMap((post) => post.tags));
    for (const tag of drafts.flatMap((post) => post.tags)) {
      if (!publishedTags.has(tag)) expect(urls).not.toContain(blogPaths.tag(tag));
    }
  });

  it("has no duplicates", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });
});
