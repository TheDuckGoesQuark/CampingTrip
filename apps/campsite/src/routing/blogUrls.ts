import { bookmarks } from "../data/bookmarks";
import { posts } from "../data/posts";
import { projects } from "../data/projects";
import { slugify } from "../data/slug";
import { tags } from "../data/tags";
import { blogPaths } from "./blogPaths";

/** Desktop items are left out: they are windows, not pages, with no reading form. */
export function blogUrls(): string[] {
  return [
    blogPaths.home,
    blogPaths.archive,
    ...posts.map((post) => blogPaths.post(slugify(post.title))),
    ...tags.map(({ tag }) => blogPaths.tag(tag)),
    ...projects.map((project) => blogPaths.project(slugify(project.title))),
    ...bookmarks.map((bookmark) => blogPaths.tool(slugify(bookmark.title))),
  ];
}
