import type { IconName } from "@jordanscamp/ds";

import { blogPaths, type BlogRef } from "../routing/blogPaths";
import type { DesktopItem } from "../types/desktop";
import type { Post } from "../types/post";
import type { Bookmark, Project } from "../types/project";
import { bookmarks } from "./bookmarks";
import { findDesktopItem } from "./desktopItems";
import { posts } from "./posts";
import { projects } from "./projects";
import { slugify } from "./slug";
import { postsTagged } from "./tags";

/** A blog URL resolved against the content behind it. */
export type BlogPage =
  | { kind: "home" }
  | { kind: "archive"; posts: Post[] }
  | { kind: "post"; post: Post }
  | { kind: "tag"; tag: string; posts: Post[] }
  | { kind: "project"; project: Project }
  | { kind: "tool"; bookmark: Bookmark }
  | { kind: "desk"; item: DesktopItem };

/**
 * The pages the mock browser renders. A desktop item is a window of its own
 * kind, never a page in a tab, so excluding it here makes the browser's own
 * renderer exhaustive rather than quietly falling through.
 */
export type BrowserPage = Exclude<BlogPage, { kind: "desk" }>;

const bySlug = <T extends { title: string }>(items: T[], slug: string): T | undefined =>
  items.find((item) => slugify(item.title) === slug);

/** `null` when the URL names nothing that exists — a 404 the caller decides about. */
export function resolveBlogPage(ref: BlogRef): BlogPage | null {
  switch (ref.kind) {
    case "home":
      return { kind: "home" };
    case "archive":
      return { kind: "archive", posts };
    case "post": {
      const post = bySlug(posts, ref.slug);
      return post ? { kind: "post", post } : null;
    }
    case "tag": {
      const tagged = postsTagged(ref.tag);
      return tagged.length > 0 ? { kind: "tag", tag: ref.tag, posts: tagged } : null;
    }
    case "project": {
      const project = bySlug(projects, ref.slug);
      return project ? { kind: "project", project } : null;
    }
    case "tool": {
      const bookmark = bySlug(bookmarks, ref.slug);
      return bookmark ? { kind: "tool", bookmark } : null;
    }
    case "desk": {
      const item = findDesktopItem(ref.slug);
      return item ? { kind: "desk", item } : null;
    }
  }
}

/** Window title and tab label for a page. */
export function titleOfBlogPage(page: BlogPage): string {
  switch (page.kind) {
    case "home":
      return "Jordan's Camp";
    case "archive":
      return "All posts";
    case "post":
      return page.post.title;
    case "tag":
      return `Tag: ${page.tag}`;
    case "project":
      return page.project.title;
    case "tool":
      return page.bookmark.title;
    case "desk":
      return page.item.label;
  }
}

/** The glyph on a page's tab. */
export function iconOfBlogPage(page: BlogPage): IconName {
  switch (page.kind) {
    case "home":
      return "house";
    case "archive":
      return "document";
    case "post":
      return "document";
    case "tag":
      return "tag";
    case "project":
      return "globe";
    case "tool":
      return "cassette";
    case "desk":
      return iconOfDesktopItem(page.item);
  }
}

/** The glyph a desktop item shows, both on the desktop and on any tab. */
export function iconOfDesktopItem(item: DesktopItem): IconName {
  switch (item.kind) {
    case "app":
      return "globe";
    case "image":
      return "image";
    case "text":
      return "document";
    case "bin":
      return "trash";
  }
}

/**
 * Where a bare `/blog/<slug>` should land. Links to those went out before the
 * scheme grew directories — `projects.ts` still carries one — so they resolve by
 * searching every kind, exactly as the flat namespace used to.
 */
export function pathForLegacySlug(slug: string): string | null {
  if (bySlug(posts, slug)) return blogPaths.post(slug);
  if (bySlug(projects, slug)) return blogPaths.project(slug);
  if (bySlug(bookmarks, slug)) return blogPaths.tool(slug);
  return null;
}
