import { describe, expect, it } from "vitest";

import {
  blogPathFor,
  blogPaths,
  isBrowserPath,
  parseBlogPath,
  stripHtml,
  type BlogRef,
} from "./blogPaths";

describe("blogPaths", () => {
  it("builds a directory-per-kind path with the cosmetic extension", () => {
    expect(blogPaths.desktop).toBe("/blog");
    expect(blogPaths.home).toBe("/blog/index.html");
    expect(blogPaths.archive).toBe("/blog/posts/index.html");
    expect(blogPaths.post("mixing-drums")).toBe("/blog/posts/mixing-drums.html");
    expect(blogPaths.tag("music")).toBe("/blog/tags/music.html");
    expect(blogPaths.project("catmap")).toBe("/blog/projects/catmap.html");
    expect(blogPaths.tool("mynoise")).toBe("/blog/tools/mynoise.html");
    expect(blogPaths.cv).toBe("/blog/cv.html");
  });

  it("keeps the PDF off /blog, where it can be said aloud", () => {
    expect(blogPaths.cvPdf).toBe("/cv.pdf");
  });

  it("leaves the extension off a desktop item, which has no address bar", () => {
    expect(blogPaths.desk("words-with-friends-txt")).toBe("/blog/desk/words-with-friends-txt");
  });

  it("leaves it off the About box too, which is a window rather than a page", () => {
    expect(blogPaths.about).toBe("/blog/about");
  });

  it("encodes a slug that would otherwise break the path", () => {
    expect(blogPaths.tag("a/b")).toBe("/blog/tags/a%2Fb.html");
  });
});

describe("stripHtml", () => {
  it("removes only a trailing extension", () => {
    expect(stripHtml("post.html")).toBe("post");
    expect(stripHtml("post")).toBe("post");
    expect(stripHtml("post.html.html")).toBe("post.html");
    expect(stripHtml("index.htmlx")).toBe("index.htmlx");
  });
});

describe("parseBlogPath", () => {
  it("reads each directory back into what it names", () => {
    expect(parseBlogPath("/blog/index.html")).toEqual({ kind: "home" });
    expect(parseBlogPath("/blog/posts/index.html")).toEqual({ kind: "archive" });
    expect(parseBlogPath("/blog/posts/mixing-drums.html")).toEqual({
      kind: "post",
      slug: "mixing-drums",
    });
    expect(parseBlogPath("/blog/tags/music.html")).toEqual({ kind: "tag", tag: "music" });
    expect(parseBlogPath("/blog/projects/catmap.html")).toEqual({
      kind: "project",
      slug: "catmap",
    });
    expect(parseBlogPath("/blog/tools/mynoise.html")).toEqual({ kind: "tool", slug: "mynoise" });
    expect(parseBlogPath("/blog/desk/words-with-friends-txt")).toEqual({
      kind: "desk",
      slug: "words-with-friends-txt",
    });
    expect(parseBlogPath("/blog/cv.html")).toEqual({ kind: "cv" });
    expect(parseBlogPath("/blog/about")).toEqual({ kind: "about" });
  });

  it("treats the extension as optional, since it is decoration", () => {
    expect(parseBlogPath("/blog/tags/music")).toEqual({ kind: "tag", tag: "music" });
    expect(parseBlogPath("/blog/index")).toEqual({ kind: "home" });
    expect(parseBlogPath("/blog/cv")).toEqual({ kind: "cv" });
  });

  it("decodes an encoded slug", () => {
    expect(parseBlogPath("/blog/tags/a%2Fb.html")).toEqual({ kind: "tag", tag: "a/b" });
  });

  it("returns null for the desktop and for anything unrecognised", () => {
    expect(parseBlogPath("/blog")).toBeNull();
    expect(parseBlogPath("/blog/photobroom")).toBeNull();
    expect(parseBlogPath("/blog/nowhere/x.html")).toBeNull();
    expect(parseBlogPath("/music")).toBeNull();
  });

  it("round-trips every ref through blogPathFor", () => {
    const refs: BlogRef[] = [
      { kind: "home" },
      { kind: "archive" },
      { kind: "post", slug: "mixing-drums" },
      { kind: "tag", tag: "music" },
      { kind: "project", slug: "catmap" },
      { kind: "tool", slug: "mynoise" },
      { kind: "cv" },
      { kind: "desk", slug: "words-with-friends-txt" },
      { kind: "about" },
    ];
    for (const ref of refs) {
      expect(parseBlogPath(blogPathFor(ref))).toEqual(ref);
    }
  });
});

describe("isBrowserPath", () => {
  it("accepts the pages the mock browser can hold in a tab", () => {
    expect(isBrowserPath(blogPaths.home)).toBe(true);
    expect(isBrowserPath(blogPaths.archive)).toBe(true);
    expect(isBrowserPath(blogPaths.tag("music"))).toBe(true);
    expect(isBrowserPath(blogPaths.project("catmap"))).toBe(true);
    expect(isBrowserPath(blogPaths.cv)).toBe(true);
  });

  it("rejects a desktop item and the About box, which open in windows of their own", () => {
    expect(isBrowserPath(blogPaths.desk("words-with-friends-txt"))).toBe(false);
    expect(isBrowserPath(blogPaths.about)).toBe(false);
  });

  it("rejects the desktop itself and anything unrecognised", () => {
    expect(isBrowserPath(blogPaths.desktop)).toBe(false);
    expect(isBrowserPath("/blog/nowhere/x.html")).toBe(false);
  });
});
