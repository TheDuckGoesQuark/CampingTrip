import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { published } from "../../../data/posts";

const post = published[0];

/** The module under test reads the list at import, so each case imports it afresh. */
beforeEach(() => vi.resetModules());

describe("ArrivedAs", () => {
  it("renders nothing for a post no sent issue announced", async () => {
    vi.doMock("../../../data/newsletters", () => ({ sentIssues: [], issues: [] }));
    const { default: ArrivedAs } = await import("./ArrivedAs");
    const { container } = render(
      <MemoryRouter>
        <ArrivedAs post={post} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
    vi.doUnmock("../../../data/newsletters");
  });

  it("shows the issue that announced the post, as it arrived", async () => {
    const issue = {
      subject: "Sent one",
      date: "2026-09-30",
      note: ["Hi."],
      posts: [post],
      sentOn: "2026-10-01",
    };
    vi.doMock("../../../data/newsletters", () => ({ sentIssues: [issue], issues: [issue] }));
    const { default: ArrivedAs, ARRIVED_AS_HEADING } = await import("./ArrivedAs");
    render(
      <MemoryRouter>
        <ArrivedAs post={post} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: ARRIVED_AS_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /subject/i })).toHaveValue("Sent one");
    expect(screen.getByRole("link", { name: "This issue" })).toHaveAttribute(
      "href",
      "/blog/newsletter/sent-one.html",
    );
    vi.doUnmock("../../../data/newsletters");
  });
});
