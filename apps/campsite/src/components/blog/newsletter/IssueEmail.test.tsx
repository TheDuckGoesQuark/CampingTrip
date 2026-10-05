import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { published } from "../../../data/posts";
import { UNSUBSCRIBE_PLACEHOLDER } from "../../../newsletter/renderIssue";
import IssueEmail, { frameDocument } from "./IssueEmail";

const issue = { subject: "An issue", date: "2026-09-30", note: ["Hi."], posts: [published[0]] };

describe("IssueEmail", () => {
  it("puts the email in a frame that runs no script and opens its links in the page", () => {
    render(<IssueEmail issue={issue} />);
    const frame = screen.getByTitle("An issue");
    expect(frame.getAttribute("sandbox")).not.toContain("allow-scripts");
    const doc = frame.getAttribute("srcdoc")!;
    expect(doc).toContain('<base target="_parent">');
    expect(doc).toContain("utm_source=newsletter");
    expect(doc).not.toContain("<script");
  });

  it("leaves out the unsubscribe link only a recipient had", () => {
    render(<IssueEmail issue={issue} />);
    expect(screen.getByTitle("An issue").getAttribute("srcdoc")).not.toContain(
      UNSUBSCRIBE_PLACEHOLDER,
    );
  });

  it("adds the base target once, right after the head opens", () => {
    expect(frameDocument("<html><head><title>x</title></head></html>")).toBe(
      '<html><head><base target="_parent"><title>x</title></head></html>',
    );
  });
});
