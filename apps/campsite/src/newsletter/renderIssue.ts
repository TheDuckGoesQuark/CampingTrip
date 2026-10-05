import { formatDate } from "../components/blog/formatDate";
import { issues } from "../data/newsletters";
import { SITE_ORIGIN } from "../data/site";
import { slugify } from "../data/slug";
import { escapeHtml } from "../prerender/head";
import { blogPaths } from "../routing/blogPaths";
import type { Issue } from "../types/newsletter";
import type { Post } from "../types/post";
import { EMAIL_TOKENS, fontStack } from "./emailTheme";

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

export const ISSUE_MASTHEAD = "Jordan's Camp.Site";

export const ISSUE_SIGN_OFF = "You joined my mailing list at";
export const ISSUE_REPLY_INVITE = "Feel free to reply with questions and ideas to this email!";

/* Tables and inline styles: an email client loads no stylesheet and honours
   little else. The values are the site's own tokens, from `emailTheme`. */
const T = EMAIL_TOKENS;
const SANS = `font-family:${fontStack(T["--font-sans"])};`;
const TEXT = `font-family:${fontStack(T["--font-text"])};`;
const PAGE = `margin:0;padding:0;background:${T["--brand-bg"]};`;
const CARD = `max-width:640px;margin:0 auto;background:${T["--brand-surface"]};border:1px solid ${T["--brand-border"]};border-radius:${T["--radius-l"]};`;
const PAD = "padding:24px 32px;";
const LABEL = `${SANS}margin:0;color:${T["--brand-text-muted"]};font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;`;
const MASTHEAD = `${SANS}margin:0;color:${T["--brand-text-muted"]};font-size:14px;line-height:1.4;font-weight:700;`;
const MUTED = `${TEXT}color:${T["--brand-text-muted"]};font-size:14px;line-height:1.55;`;
const LINK = `color:${T["--brand-link"]};`;
const BODY = `${TEXT}margin:0 0 16px;color:${T["--brand-text"]};font-size:17px;line-height:1.62;`;

interface Frame {
  /** The archive's copy has no one to unsubscribe, and the placeholder would be a dead link. */
  unsubscribe: boolean;
}

function htmlOf(issue: Issue, { unsubscribe }: Frame): string {
  const paragraphs = issue.note
    .map((line, index) => {
      const last = index === issue.note.length - 1 ? "margin-bottom:0;" : "";
      return `<p style="${BODY}${last}">${escapeHtml(line)}</p>`;
    })
    .join("\n");
  const posts = issue.posts
    .map((post) => {
      const href = escapeHtml(postLink(issue, post));
      return `<tr><td style="${PAD}border-top:1px solid ${T["--brand-border"]};">
  <p style="${LABEL}">${escapeHtml(formatDate(post.date))}</p>
  <h2 style="${SANS}margin:8px 0 8px;font-size:21px;line-height:1.3;font-weight:800;"><a href="${href}" style="${LINK}text-decoration:none;">${escapeHtml(post.title)}</a></h2>
  <p style="${TEXT}margin:0;font-size:18px;line-height:1.6;"><a href="${href}" style="color:${T["--brand-text-muted"]};text-decoration:none;">${escapeHtml(post.standfirst)}</a></p>
</td></tr>`;
    })
    .join("\n");
  const unsubscribeLink = unsubscribe
    ? `<a href="${UNSUBSCRIBE_PLACEHOLDER}" style="${LINK}">Unsubscribe</a> · `
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(issue.subject)}</title>
</head>
<body style="${PAGE}${TEXT}color:${T["--brand-text"]};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${PAGE}"><tr><td style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${CARD}">
<tr><td style="${PAD}border-bottom:1px solid ${T["--brand-border-strong"]};">
  <p style="${MASTHEAD}"><a href="${SITE_ORIGIN}" style="${LINK}text-decoration:none;">${escapeHtml(ISSUE_MASTHEAD)}</a> · ${escapeHtml(formatDate(issue.date))}</p>
  <h1 style="${SANS}margin:8px 0 0;color:${T["--brand-text"]};font-size:32px;line-height:1.2;font-weight:800;">${escapeHtml(issue.subject)}</h1>
</td></tr>
<tr><td style="${PAD}">
${paragraphs}
</td></tr>
${posts}
<tr><td style="${PAD}border-top:1px solid ${T["--brand-border"]};">
  <p style="${MUTED}margin:0 0 8px;">${ISSUE_SIGN_OFF} <a href="${SITE_ORIGIN}" style="${LINK}">jordanscamp.site</a>. ${ISSUE_REPLY_INVITE}</p>
  <p style="${MUTED}margin:0;">${unsubscribeLink}<a href="${SITE_ORIGIN}${blogPaths.privacy}" style="${LINK}">Privacy</a></p>
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
    `${ISSUE_MASTHEAD} · ${formatDate(issue.date)}`,
    "",
    issue.subject.toUpperCase(),
    "",
    ...issue.note.flatMap((line) => [line, ""]),
    ...posts,
    "--",
    `${ISSUE_SIGN_OFF} ${SITE_ORIGIN}. ${ISSUE_REPLY_INVITE}`,
    `Unsubscribe: ${UNSUBSCRIBE_PLACEHOLDER}`,
    `Privacy: ${SITE_ORIGIN}${blogPaths.privacy}`,
    "",
  ].join("\n");
}

/** The issue as it was sent, for the archive: the same document, less the unsubscribe link. */
export function archivedIssueHtml(issue: Issue): string {
  return htmlOf(issue, { unsubscribe: false });
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
    html: htmlOf(issue, { unsubscribe: true }),
    text: textOf(issue),
  };
}

/** `null` when no issue has that slug; the caller lists the ones that exist. */
export function renderIssueBySlug(slug: string): RenderedIssue | null {
  const issue = issues.find((candidate) => issueSlug(candidate) === slug);
  return issue ? renderIssue(issue) : null;
}
