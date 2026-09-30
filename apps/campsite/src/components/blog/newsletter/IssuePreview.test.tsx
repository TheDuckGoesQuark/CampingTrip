import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { published } from "../../../data/posts";
import type { Issue } from "../../../types/newsletter";
import IssuePreview, { ISSUE_FROM, ISSUE_TO, previewDocument } from "./IssuePreview";

const issue: Issue = {
  subject: "A test issue",
  date: "2026-09-30",
  note: ["A line."],
  posts: [published[0]],
};

describe("IssuePreview", () => {
  it("shows the headers as read-only fields", () => {
    render(
      <MemoryRouter>
        <IssuePreview issue={issue} />
      </MemoryRouter>,
    );
    for (const [name, value] of [
      [/^from$/i, ISSUE_FROM],
      [/^to$/i, ISSUE_TO],
      [/subject/i, issue.subject],
    ] as const) {
      const field = screen.getByRole("textbox", { name });
      expect(field).toHaveValue(value);
      expect(field).toHaveAttribute("readonly");
    }
  });

  it("puts the rendered email in a sandboxed frame whose links open the site", () => {
    render(
      <MemoryRouter>
        <IssuePreview issue={issue} />
      </MemoryRouter>,
    );
    const frame = screen.getByTitle(`${issue.subject}, as it arrives`);
    expect(frame.tagName).toBe("IFRAME");
    expect(frame).toHaveAttribute("sandbox", "allow-top-navigation-by-user-activation");
    const doc = frame.getAttribute("srcdoc")!;
    expect(doc).toContain('<base target="_parent">');
    expect(doc).toContain("utm_source=newsletter");
    expect(doc).not.toContain("<script");
  });

  it("says in the status bar whether the issue went out", () => {
    const { rerender } = render(
      <MemoryRouter>
        <IssuePreview issue={issue} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Not yet sent")).toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <IssuePreview issue={{ ...issue, sentOn: "2026-10-01" }} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/^Sent /)).toBeInTheDocument();
  });

  it("adds the base target once, right after the head opens", () => {
    expect(previewDocument("<html><head><title>x</title></head></html>")).toBe(
      '<html><head><base target="_parent"><title>x</title></head></html>',
    );
  });
});
