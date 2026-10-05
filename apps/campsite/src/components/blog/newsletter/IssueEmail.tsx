import { archivedIssueHtml } from "../../../newsletter/renderIssue";
import type { Issue } from "../../../types/newsletter";

import styles from "./IssueEmail.module.css";

/**
 * A link in the message opens in the page, not inside the frame. Only the
 * site's copy gets this; the email that is sent has no frame to escape.
 */
export function frameDocument(html: string): string {
  return html.replace("<head>", '<head><base target="_parent">');
}

/**
 * Grows the frame to its document's height, so the email reads as part of the
 * page rather than a box with its own scrollbar. Same-origin is what lets the
 * page measure it, and is safe only because the sandbox still runs no script.
 */
function fitToContent(frame: HTMLIFrameElement | null) {
  if (!frame) return;
  let observer: ResizeObserver | undefined;
  const fit = () => {
    const body = frame.contentDocument?.body;
    if (body) frame.style.height = `${Math.ceil(body.getBoundingClientRect().height)}px`;
  };
  const watch = () => {
    observer?.disconnect();
    fit();
    const body = frame.contentDocument?.body;
    if (body && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(fit);
      observer.observe(body);
    }
  };
  frame.addEventListener("load", watch);
  // A prerendered frame can finish loading before the page hydrates.
  if (frame.contentDocument?.body?.childElementCount) watch();
  return () => {
    frame.removeEventListener("load", watch);
    observer?.disconnect();
  };
}

/** An issue as it was sent, less the unsubscribe link only its recipients had. */
export default function IssueEmail({ issue }: { issue: Issue }) {
  return (
    <iframe
      ref={fitToContent}
      className={styles.email}
      title={issue.subject}
      srcDoc={frameDocument(archivedIssueHtml(issue))}
      sandbox="allow-same-origin allow-top-navigation-by-user-activation"
    />
  );
}
