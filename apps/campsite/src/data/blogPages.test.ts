import { describe, expect, it } from "vitest";

import {
  iconOfBlogPage,
  metaOfBlogPage,
  pathForLegacySlug,
  resolveBlogPage,
  titleOfBlogPage,
} from "./blogPages";
import { cv } from "./cv";
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

  it("resolves the CV without a lookup", () => {
    expect(resolveBlogPage({ kind: "cv" })).toEqual({ kind: "cv", cv });
  });

  it("resolves a desktop item", () => {
    const page = resolveBlogPage({ kind: "desk", slug: "words-with-friends-txt" });
    expect(page?.kind).toBe("desk");
    if (page?.kind !== "desk") return;
    expect(page.item.label).toBe("words_with_friends.txt");
  });

  it("returns null for a desktop slug that names nothing", () => {
    expect(resolveBlogPage({ kind: "desk", slug: "not-there" })).toBeNull();
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
    expect(titleOfBlogPage({ kind: "cv", cv })).toBe("CV");
  });
});

describe("metaOfBlogPage", () => {
  it("describes the CV as a profile of its author, with the PDF as an alternate form", () => {
    const meta = metaOfBlogPage({ kind: "cv", cv });
    expect(meta.title).toBe(cv.name);
    expect(meta.description).toBe(cv.headline);
    expect(meta.alternate).toEqual({ type: "application/pdf", path: "/cv.pdf" });
    if (meta.kind !== "profile") throw new Error(`expected a profile, got ${meta.kind}`);
    expect(meta.person.name).toBe(cv.name);
    expect(meta.person.jobTitle).toBe(cv.experience.find((role) => !role.end)?.title);
    expect(meta.person.dateModified).toBe(cv.updated);
    for (const url of meta.person.sameAs) expect(url).not.toMatch(/^mailto:/);
    for (const item of cv.skills.flatMap((group) => group.items)) {
      expect(meta.person.knowsAbout).toContain(item);
    }
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
