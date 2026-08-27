import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tag } from "./Tag";

describe("Tag", () => {
  it("renders a span by default", () => {
    render(<Tag>music</Tag>);
    expect(screen.getByText("music").tagName).toBe("SPAN");
  });

  it("becomes a link when passed `render`", () => {
    render(<Tag render={<a href="/blog/tags/music.html" />}>music</Tag>);
    expect(screen.getByRole("link", { name: "music" })).toHaveAttribute(
      "href",
      "/blog/tags/music.html",
    );
  });

  it("renders a count alongside the label", () => {
    render(<Tag count={3}>music</Tag>);
    expect(screen.getByText("music")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("omits the count entirely when not given one", () => {
    const { container } = render(<Tag>music</Tag>);
    expect(container.querySelectorAll("span")).toHaveLength(1);
  });

  it("renders a zero count rather than treating it as absent", () => {
    render(<Tag count={0}>music</Tag>);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("resolves a different class when selected", () => {
    render(
      <>
        <Tag>a</Tag>
        <Tag selected>b</Tag>
      </>,
    );
    expect(screen.getByText("a").className).not.toEqual(screen.getByText("b").className);
  });

  it("forwards aria-current for the tag standing for the current page", () => {
    render(
      <Tag selected aria-current="page">
        music
      </Tag>,
    );
    expect(screen.getByText("music")).toHaveAttribute("aria-current", "page");
  });
});
