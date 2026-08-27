import type { BrowserPage } from "../../data/blogPages";
import FeedPage from "./FeedPage";
import HomePage from "./HomePage";
import PostPage from "./PostPage";
import ProjectPage from "./ProjectPage";
import ToolPage from "./ToolPage";

/**
 * Renders whichever page the browser's active tab names. The one place that maps
 * a resolved `BlogPage` onto a component, so the overlay stays about chrome.
 */
export default function BlogPageView({ page }: { page: BrowserPage }) {
  switch (page.kind) {
    case "home":
      return <HomePage />;
    case "archive":
      return <FeedPage posts={page.posts} />;
    case "tag":
      return <FeedPage posts={page.posts} tag={page.tag} />;
    case "post":
      return <PostPage post={page.post} />;
    case "project":
      return <ProjectPage project={page.project} />;
    case "tool":
      return <ToolPage bookmark={page.bookmark} />;
  }
}
