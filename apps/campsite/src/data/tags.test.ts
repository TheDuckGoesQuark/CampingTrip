import { describe, expect, it } from "vitest";

import { posts } from "./posts";
import { postsTagged, tags } from "./tags";

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

  it("orders busiest first, then alphabetically so ties hold still", () => {
    for (let i = 1; i < tags.length; i++) {
      const [previous, current] = [tags[i - 1], tags[i]];
      expect(previous.count).toBeGreaterThanOrEqual(current.count);
      if (previous.count === current.count) {
        expect(previous.tag.localeCompare(current.tag)).toBeLessThan(0);
      }
    }
  });
});

describe("postsTagged", () => {
  it("returns the posts carrying a tag, newest first", () => {
    const tagged = postsTagged("music");
    expect(tagged.length).toBeGreaterThan(0);
    expect(tagged.every((post) => post.tags.includes("music"))).toBe(true);
    expect(tagged).toEqual(posts.filter((post) => post.tags.includes("music")));
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

  it("gives every post a distinct slug", () => {
    const slugs = posts.map((post) => post.title.toLowerCase());
    expect(new Set(slugs).size).toBe(posts.length);
  });
});
