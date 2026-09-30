import { formatDate } from "../components/blog/formatDate";
import { issues } from "../data/newsletters";
import { SITE, SITE_ORIGIN } from "../data/site";
import { slugify } from "../data/slug";
import { escapeHtml } from "../prerender/head";
import { blogPaths } from "../routing/blogPaths";
import type { Issue } from "../types/newsletter";
import type { Post } from "../types/post";

/**
 * Left where each recipient's own unsubscribe link goes. The worker fills it;
 * the string is its `UNSUBSCRIBE_PLACEHOLDER` in
 * `infra/lambda/newsletter-worker/message.mjs`.
 */
export const UNSUBSCRIBE_PLACEHOLDER = "{{unsubscribe_url}}";

export interface RenderedIssue {
  slug: string;
  subject: string;
  date: string;
  draft: boolean;
  html: string;
  text: string;
}

export const issueSlug = (issue: Issue): string => slugify(issue.subject);

export const issueSlugs = (): string[] => issues.map(issueSlug);

/**
 * Tagged so the analytics can tell a visit from an issue apart from any
 * other, without a pixel and without knowing who followed it.
 */
export function postLink(issue: Issue, post: Post): string {
  const params = new URLSearchParams({
    utm_source: "newsletter",
    utm_medium: "email",
    utm_campaign: issueSlug(issue),
  });
  return `${SITE_ORIGIN}${blogPaths.post(slugify(post.title))}?${params}`;
}

/* Inline styles, tables and web-safe fonts: an email client loads no
   stylesheet and honours little else. */
const PAGE = "margin:0;padding:0;background:#f4efe6;";
const BODY_FONT = "font-family:Georgia,'Times New Roman',serif;color:#2b2a26;";
const CARD = "max-width:600px;margin:0 auto;background:#fffdf8;border:2px solid #2b2a26;";
const PAD = "padding:24px 28px;";
const MUTED = "color:#6b675f;font-size:14px;";
const LINK = "color:#3f6b4f;";

function htmlOf(issue: Issue): string {
  const paragraphs = issue.note
    .map(
      (line) =>
        `<p style="margin:0 0 16px;font-size:17px;line-height:1.55;">${escapeHtml(line)}</p>`,
    )
    .join("\n");
  const posts = issue.posts
    .map((post) => {
      const href = escapeHtml(postLink(issue, post));
      return `<tr><td style="${PAD}border-top:1px solid #d9d2c3;">
  <p style="margin:0 0 4px;${MUTED}">${escapeHtml(formatDate(post.date))}</p>
  <h2 style="margin:0 0 8px;font-size:22px;line-height:1.3;"><a href="${href}" style="${LINK}text-decoration:none;">${escapeHtml(post.title)}</a></h2>
  <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">${escapeHtml(post.standfirst)}</p>
  <p style="margin:0;"><a href="${href}" style="${LINK}font-weight:bold;">Read it</a></p>
</td></tr>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(issue.subject)}</title>
</head>
<body style="${PAGE}${BODY_FONT}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${PAGE}"><tr><td style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${CARD}">
<tr><td style="${PAD}border-bottom:2px solid #2b2a26;">
  <p style="margin:0;${MUTED}"><a href="${SITE_ORIGIN}" style="${LINK}text-decoration:none;font-weight:bold;">${escapeHtml(SITE)}</a> · ${escapeHtml(formatDate(issue.date))}</p>
  <h1 style="margin:8px 0 0;font-size:26px;line-height:1.25;">${escapeHtml(issue.subject)}</h1>
</td></tr>
<tr><td style="${PAD}">
${paragraphs}
</td></tr>
${posts}
<tr><td style="${PAD}border-top:2px solid #2b2a26;${MUTED}">
  <p style="margin:0 0 8px;">You asked for these at <a href="${SITE_ORIGIN}" style="${LINK}">jordanscamp.site</a>. Reply to this email and it reaches me.</p>
  <p style="margin:0;"><a href="${UNSUBSCRIBE_PLACEHOLDER}" style="${LINK}">Unsubscribe</a> · <a href="${SITE_ORIGIN}${blogPaths.privacy}" style="${LINK}">Privacy</a></p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>
`;
}

function textOf(issue: Issue): string {
  const posts = issue.posts.flatMap((post) => [
    `${post.title} (${formatDate(post.date)})`,
    post.standfirst,
    postLink(issue, post),
    "",
  ]);
  return [
    `${SITE} · ${formatDate(issue.date)}`,
    "",
    issue.subject.toUpperCase(),
    "",
    ...issue.note.flatMap((line) => [line, ""]),
    ...posts,
    "--",
    `You asked for these at ${SITE_ORIGIN}. Reply to this email and it reaches me.`,
    `Unsubscribe: ${UNSUBSCRIBE_PLACEHOLDER}`,
    `Privacy: ${SITE_ORIGIN}${blogPaths.privacy}`,
    "",
  ].join("\n");
}

export function renderIssue(issue: Issue): RenderedIssue {
  const unpublished = issue.posts.filter((post) => post.draft);
  if (unpublished.length > 0) {
    throw new Error(
      `"${issue.subject}" points at a draft post: ${unpublished.map((post) => post.title).join(", ")}`,
    );
  }
  return {
    slug: issueSlug(issue),
    subject: issue.subject,
    date: issue.date,
    draft: issue.draft === true,
    html: htmlOf(issue),
    text: textOf(issue),
  };
}

/** `null` when no issue has that slug; the caller lists the ones that exist. */
export function renderIssueBySlug(slug: string): RenderedIssue | null {
  const issue = issues.find((candidate) => issueSlug(candidate) === slug);
  return issue ? renderIssue(issue) : null;
}
