import { describe, expect, it } from "vitest";

import { blogPathFor, blogPaths, parseBlogPath, stripHtml, type BlogRef } from "./blogPaths";

describe("blogPaths", () => {
  it("builds a directory-per-kind path with the cosmetic extension", () => {
    expect(blogPaths.desktop).toBe("/blog");
    expect(blogPaths.home).toBe("/blog/index.html");
    expect(blogPaths.archive).toBe("/blog/posts/index.html");
    expect(blogPaths.post("mixing-drums")).toBe("/blog/posts/mixing-drums.html");
    expect(blogPaths.tag("music")).toBe("/blog/tags/music.html");
    expect(blogPaths.project("catmap")).toBe("/blog/projects/catmap.html");
    expect(blogPaths.tool("mynoise")).toBe("/blog/tools/mynoise.html");
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
  });

  it("treats the extension as optional, since it is decoration", () => {
    expect(parseBlogPath("/blog/tags/music")).toEqual({ kind: "tag", tag: "music" });
    expect(parseBlogPath("/blog/index")).toEqual({ kind: "home" });
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
    ];
    for (const ref of refs) {
      expect(parseBlogPath(blogPathFor(ref))).toEqual(ref);
    }
  });
});
