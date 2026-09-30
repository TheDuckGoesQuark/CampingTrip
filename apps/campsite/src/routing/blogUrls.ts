import { bookmarks } from "../data/bookmarks";
import { sentIssues } from "../data/newsletters";
import { published } from "../data/posts";
import { projects } from "../data/projects";
import { slugify } from "../data/slug";
import { SUBSCRIBE_NOTICES } from "../data/subscribeNotices";
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
    blogPaths.cv,
    blogPaths.cvCondensed,
    blogPaths.privacy,
    blogPaths.subscribe,
    blogPaths.issues,
    ...sentIssues.map((issue) => blogPaths.issue(slugify(issue.subject))),
    ...published.map((post) => blogPaths.post(slugify(post.title))),
    ...tagsOf(published).map(({ tag }) => blogPaths.tag(tag)),
    ...projects.map((project) => blogPaths.project(slugify(project.title))),
    ...bookmarks.map((bookmark) => blogPaths.tool(slugify(bookmark.title))),
  ];
}

/**
 * Prerendered like the rest, so a form post lands on a real page with scripts
 * off, but neither listed in the sitemap nor fed: each only ever follows an
 * action, and is marked `noindex` in its head.
 */
export function unlistedBlogUrls(): string[] {
  return SUBSCRIBE_NOTICES.map((notice) => blogPaths.subscribeNotice(notice.name));
}
