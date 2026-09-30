import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { issues } from "../data/newsletters";
import { published } from "../data/posts";
import { slugify } from "../data/slug";
import type { Issue } from "../types/newsletter";
import {
  issueSlug,
  issueSlugs,
  postLink,
  renderIssue,
  renderIssueBySlug,
  UNSUBSCRIBE_PLACEHOLDER,
} from "./renderIssue";

const post = published[0];
const issue: Issue = {
  subject: "A <test> issue & more",
  date: "2026-09-30",
  note: ["First line, with <angle> brackets.", "Second line."],
  posts: [post],
};

describe("renderIssue", () => {
  const rendered = renderIssue(issue);

  it("derives the slug from the subject, as a post does from its title", () => {
    expect(rendered.slug).toBe(slugify(issue.subject));
    expect(issueSlugs()).toEqual(issues.map(issueSlug));
  });

  it("escapes what it is given in the HTML and leaves the text alone", () => {
    expect(rendered.html).toContain("A &lt;test&gt; issue &amp; more");
    expect(rendered.html).not.toContain("<test>");
    expect(rendered.text).toContain("First line, with <angle> brackets.");
  });

  it("links every post with the newsletter's tags, in both parts", () => {
    const link = postLink(issue, post);
    expect(link).toContain(`/blog/posts/${slugify(post.title)}.html?`);
    expect(link).toContain("utm_source=newsletter");
    expect(link).toContain(`utm_campaign=${rendered.slug}`);
    expect(rendered.html).toContain(`href="${link.replace(/&/g, "&amp;")}"`);
    expect(rendered.text).toContain(link);
  });

  it("leaves the unsubscribe placeholder for the worker, once in each part", () => {
    expect(rendered.html.split(UNSUBSCRIBE_PLACEHOLDER)).toHaveLength(2);
    expect(rendered.text.split(UNSUBSCRIBE_PLACEHOLDER)).toHaveLength(2);
  });

  it("refuses an issue that points at a draft post", () => {
    const draft = { ...post, title: "Unfinished", draft: true };
    expect(() => renderIssue({ ...issue, posts: [draft] })).toThrow(/draft post: Unfinished/);
  });

  it("finds an issue by slug and says so when there is none", () => {
    expect(renderIssueBySlug(issueSlug(issues[0]))?.subject).toBe(issues[0].subject);
    expect(renderIssueBySlug("nothing-here")).toBeNull();
  });

  it("uses the same placeholder string as the worker", () => {
    const worker = readFileSync(
      resolve(process.cwd(), "../../infra/lambda/newsletter-worker/message.mjs"),
      "utf8",
    );
    expect(worker).toContain(`UNSUBSCRIBE_PLACEHOLDER = "${UNSUBSCRIBE_PLACEHOLDER}"`);
  });
});

describe("the authored issues", () => {
  it("all render, and point only at published posts", () => {
    for (const authored of issues) {
      expect(() => renderIssue(authored), authored.subject).not.toThrow();
      // `published` re-creates each post with sorted tags, so compare by title.
      const titles = published.map((candidate) => candidate.title);
      for (const linked of authored.posts) expect(titles).toContain(linked.title);
    }
  });
});
