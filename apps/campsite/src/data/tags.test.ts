import { describe, expect, it } from "vitest";

import { isTopTag, parentOf, TAG_TREE, TOP_TAGS } from "../types/tags";
import { posts } from "./posts";
import { byTier, postsTagged, tags, topTags } from "./tags";

describe("TAG_TREE", () => {
  it("files every sub-tag under exactly one top tag, and no name is both", () => {
    const subs = TOP_TAGS.flatMap((top) => TAG_TREE[top] as readonly string[]);
    expect(new Set(subs).size).toBe(subs.length);
    for (const sub of subs) expect(TOP_TAGS as string[]).not.toContain(sub);
  });

  it("names a sub-tag's parent, and no parent for a top tag", () => {
    expect(parentOf("react")).toBe("code");
    expect(parentOf("music")).toBe("creative");
    expect(parentOf("ai")).toBeUndefined();
    expect(isTopTag("code")).toBe(true);
    expect(isTopTag("rust")).toBe(false);
  });
});

describe("tags", () => {
  it("counts every tag in use, and only tags in use", () => {
    const used = new Set(posts.flatMap((post) => post.tags));
    expect(new Set(tags.map((t) => t.tag))).toEqual(used);
  });

  it("counts derived from the posts rather than stored on them", () => {
    for (const { tag, count } of tags) {
      expect(count).toBe(posts.filter((post) => post.tags.includes(tag)).length);
    }
  });

  it("orders top tags first, then sub-tags, alphabetical within each tier", () => {
    const sorted = [...tags].sort((a, b) => byTier(a.tag, b.tag));
    expect(tags).toEqual(sorted);
    expect(byTier("creative", "ableton")).toBeLessThan(0);
    expect(byTier("ableton", "art")).toBeLessThan(0);
    expect(byTier("code", "ai")).toBeGreaterThan(0);
  });

  it("offers only the top tier where the rail indexes", () => {
    expect(topTags).toEqual(tags.filter(({ tag }) => isTopTag(tag)));
    expect(topTags.every(({ tag }) => isTopTag(tag))).toBe(true);
  });
});

describe("postsTagged", () => {
  it("returns the posts carrying a tag, newest first", () => {
    // Read off the data: a tag named here dies the day its last post does.
    const first = tags[0].tag;
    const tagged = postsTagged(first);
    expect(tagged.length).toBeGreaterThan(0);
    expect(tagged.every((post) => post.tags.includes(first))).toBe(true);
    expect(tagged).toEqual(posts.filter((post) => post.tags.includes(first)));
  });

  it("returns nothing for an unused tag", () => {
    expect(postsTagged("taxidermy")).toEqual([]);
  });
});

describe("posts", () => {
  it("runs newest first, so no feed has to sort", () => {
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1].date >= posts[i].date).toBe(true);
    }
  });

  it("holds each post's tags alphabetically, so no card has to sort", () => {
    for (const post of posts) {
      expect(post.tags).toEqual([...post.tags].sort((a, b) => a.localeCompare(b)));
    }
  });

  it("files a post under a sub-tag's parent too, so the top tag's page holds it", () => {
    for (const post of posts) {
      for (const tag of post.tags) {
        const parent = parentOf(tag);
        if (parent) expect(post.tags).toContain(parent);
      }
    }
  });

  it("gives every post a distinct slug", () => {
    const slugs = posts.map((post) => post.title.toLowerCase());
    expect(new Set(slugs).size).toBe(posts.length);
  });
});
