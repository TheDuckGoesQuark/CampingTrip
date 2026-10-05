import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("shows the issue folded, opens it on request, and links the archive", async () => {
    const issue = {
      subject: "Sent one",
      date: "2026-09-30",
      note: ["Hi."],
      posts: [post],
      sentOn: "2026-10-01",
    };
    vi.doMock("../../../data/newsletters", () => ({ sentIssues: [issue], issues: [issue] }));
    const {
      default: ArrivedAs,
      ARRIVED_AS_HEADING,
      ALL_ISSUES_LINK,
      EXPAND_LABEL,
    } = await import("./ArrivedAs");
    render(
      <MemoryRouter>
        <ArrivedAs post={post} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: ARRIVED_AS_HEADING })).toBeInTheDocument();
    expect(screen.getByTitle("Sent one").tagName).toBe("IFRAME");
    expect(screen.getByRole("link", { name: ALL_ISSUES_LINK })).toHaveAttribute(
      "href",
      "/blog/newsletter/index.html",
    );

    const toggle = screen.getByRole("button", { name: EXPAND_LABEL });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.setup().click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).toHaveAttribute(
      "data-open",
    );
    vi.doUnmock("../../../data/newsletters");
  });
});
