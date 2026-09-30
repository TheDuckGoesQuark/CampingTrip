import { Text, Window } from "@jordanscamp/ds";

import { renderIssue } from "../../../newsletter/renderIssue";
import type { Issue } from "../../../types/newsletter";
import { MouseMail } from "../contact/MouseMail";
import { formatDate } from "../formatDate";

import styles from "./IssuePreview.module.css";

/** The address issues come from. The identity lives in infra; this is what a reader sees. */
export const ISSUE_FROM = "Jordan Mackie <hello@jordanscamp.site>";

/** What the reader's own address reads as in the preview, since we do not know it. */
export const ISSUE_TO = "you";

/**
 * A link in the message opens the site in the page, not inside the frame.
 * Only the preview gets this; the email that is sent has no frame to escape.
 */
export function previewDocument(html: string): string {
  return html.replace("<head>", '<head><base target="_parent">');
}

/**
 * An issue as it arrives: MouseMail's chrome, read-only, with the rendered
 * email inside. The email is its own document with its own styles, so it sits
 * in an iframe rather than in the page's stylesheet, and a fixed height with
 * its own scrollbar is how a mail client shows a message too.
 */
export default function IssuePreview({ issue }: { issue: Issue }) {
  const rendered = renderIssue(issue);
  return (
    <Window inline>
      <Window.TitleBar title="MouseMail" />
      <Window.Body flush>
        <MouseMail>
          <MouseMail.Headers>
            <MouseMail.From value={ISSUE_FROM} />
            <MouseMail.To value={ISSUE_TO} />
            <MouseMail.Subject value={issue.subject} />
          </MouseMail.Headers>
          <MouseMail.Body>
            <iframe
              className={styles.message}
              title={`${issue.subject}, as it arrives`}
              srcDoc={previewDocument(rendered.html)}
              sandbox="allow-top-navigation-by-user-activation"
              loading="lazy"
            />
          </MouseMail.Body>
        </MouseMail>
      </Window.Body>
      <Window.StatusBar>
        <Text variant="label" tone="muted" as="span">
          {issue.sentOn ? `Sent ${formatDate(issue.sentOn)}` : "Not yet sent"}
        </Text>
      </Window.StatusBar>
    </Window>
  );
}
