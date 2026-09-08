import { describe, expect, it } from "vitest";

import { resolveBlogPage } from "../data/blogPages";
import { blogPathFor, parseBlogPath } from "./blogPaths";
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

  it("names every kind of browser page and no desktop item", () => {
    const kinds = new Set(urls.map((url) => parseBlogPath(url)!.kind));
    expect(kinds).toEqual(new Set(["home", "archive", "post", "tag", "project", "tool"]));
  });

  it("has no duplicates", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });
});
