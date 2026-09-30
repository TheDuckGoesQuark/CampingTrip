import type { BrowserPage } from "../../data/blogPages";
import ContactFooter from "./ContactFooter";
import CvCondensedPage from "./CvCondensedPage";
import CvPage from "./CvPage";
import FeedPage from "./FeedPage";
import HomePage from "./HomePage";
import NoticePage from "./NoticePage";
import PostPage from "./PostPage";
import PrivacyPage from "./PrivacyPage";
import ProjectPage from "./ProjectPage";
import SubscribePage from "./SubscribePage";
import ToolPage from "./ToolPage";

import styles from "./BlogPageView.module.css";

/**
 * Renders whichever page the browser's active tab names. The one place that maps
 * a resolved `BlogPage` onto a component, so the overlay stays about chrome.
 */
export default function BlogPageView({ page }: { page: BrowserPage }) {
  return (
    <>
      <div className={styles.page}>
        <PageBody page={page} />
      </div>
      <ContactFooter page={page} />
    </>
  );
}

function PageBody({ page }: { page: BrowserPage }) {
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
    case "cv":
      return <CvPage cv={page.cv} />;
    case "cvCondensed":
      return <CvCondensedPage cv={page.cv} />;
    case "privacy":
      return <PrivacyPage />;
    case "subscribe":
      return <SubscribePage />;
    case "notice":
      return <NoticePage notice={page.notice} />;
  }
}
