import { describe, expect, it } from "vitest";

import { iconOfBlogPage, pathForLegacySlug, resolveBlogPage, titleOfBlogPage } from "./blogPages";
import { posts } from "./posts";
import { slugify } from "./slug";

describe("resolveBlogPage", () => {
  it("resolves the home and archive pages without a lookup", () => {
    expect(resolveBlogPage({ kind: "home" })).toEqual({ kind: "home" });
    expect(resolveBlogPage({ kind: "archive" })).toEqual({ kind: "archive", posts });
  });

  it("finds a post by the slug derived from its title", () => {
    const post = posts[0];
    const page = resolveBlogPage({ kind: "post", slug: slugify(post.title) });
    expect(page).toEqual({ kind: "post", post });
  });

  it("finds a project and a tool", () => {
    expect(resolveBlogPage({ kind: "project", slug: "catmap" })?.kind).toBe("project");
    expect(resolveBlogPage({ kind: "tool", slug: "mynoise" })?.kind).toBe("tool");
  });

  it("resolves a tag to every post carrying it", () => {
    const page = resolveBlogPage({ kind: "tag", tag: "music" });
    expect(page?.kind).toBe("tag");
    if (page?.kind !== "tag") return;
    expect(page.posts.length).toBeGreaterThan(0);
    expect(page.posts.every((post) => post.tags.includes("music"))).toBe(true);
  });

  it("returns null for a tag nothing carries, rather than an empty page", () => {
    expect(resolveBlogPage({ kind: "tag", tag: "taxidermy" })).toBeNull();
  });

  it("returns null when the slug names nothing", () => {
    expect(resolveBlogPage({ kind: "post", slug: "never-written" })).toBeNull();
    expect(resolveBlogPage({ kind: "project", slug: "never-built" })).toBeNull();
    expect(resolveBlogPage({ kind: "tool", slug: "never-used" })).toBeNull();
  });
});

describe("titleOfBlogPage and iconOfBlogPage", () => {
  it("name and illustrate each kind", () => {
    expect(titleOfBlogPage({ kind: "home" })).toBe("Jordan's Camp");
    expect(titleOfBlogPage({ kind: "tag", tag: "music", posts: [] })).toBe("Tag: music");
    expect(iconOfBlogPage({ kind: "home" })).toBe("house");
    expect(iconOfBlogPage({ kind: "tag", tag: "music", posts: [] })).toBe("tag");
  });
});

describe("pathForLegacySlug", () => {
  it("sends a flat slug to whichever directory now holds it", () => {
    // projects.ts still publishes this link, so it has to keep resolving.
    expect(pathForLegacySlug("photobroom")).toBe("/blog/projects/photobroom.html");
    expect(pathForLegacySlug("mynoise")).toBe("/blog/tools/mynoise.html");
    expect(pathForLegacySlug(slugify(posts[0].title))).toBe(
      `/blog/posts/${slugify(posts[0].title)}.html`,
    );
  });

  it("returns null for a slug that never existed", () => {
    expect(pathForLegacySlug("nonsense")).toBeNull();
  });
});
