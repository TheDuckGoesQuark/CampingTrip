import { bookmarks } from "../data/bookmarks";
import { published } from "../data/posts";
import { projects } from "../data/projects";
import { slugify } from "../data/slug";
import { tagsOf } from "../data/tags";
import { blogPaths } from "./blogPaths";

/**
 * Every page with a reading form, which is what gets prerendered, listed in the
 * sitemap and fed. Desktop items are left out: they are windows, not pages.
 * Drafts are left out too, and so is any tag only a draft carries, since that
 * tag page would have nothing on it a reader is meant to see yet.
 */
export function blogUrls(): string[] {
  return [
    blogPaths.home,
    blogPaths.archive,
    ...published.map((post) => blogPaths.post(slugify(post.title))),
    ...tagsOf(published).map(({ tag }) => blogPaths.tag(tag)),
    ...projects.map((project) => blogPaths.project(slugify(project.title))),
    ...bookmarks.map((bookmark) => blogPaths.tool(slugify(bookmark.title))),
  ];
}
