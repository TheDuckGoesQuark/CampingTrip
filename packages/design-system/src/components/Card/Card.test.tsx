import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "./Card";

describe("Card", () => {
  it("renders a div by default", () => {
    render(<Card>Contents</Card>);
    expect(screen.getByText("Contents").tagName).toBe("DIV");
  });

  it("becomes the given element when passed `render`", () => {
    render(<Card render={<a href="/somewhere" />}>Whole card is a link</Card>);
    const link = screen.getByRole("link", { name: "Whole card is a link" });
    expect(link).toHaveAttribute("href", "/somewhere");
  });

  it("keeps its own classes when rendered as another element", () => {
    render(<Card render={<a href="/somewhere" />}>Styled link</Card>);
    expect(screen.getByRole("link").className.trim().length).toBeGreaterThan(0);
  });

  it("resolves a different class per tone and per elevation", () => {
    render(
      <>
        <Card tone="surface">a</Card>
        <Card tone="sunken">b</Card>
        <Card elevation="floating">c</Card>
      </>,
    );
    const surface = screen.getByText("a").className;
    const sunken = screen.getByText("b").className;
    const floating = screen.getByText("c").className;
    expect(surface).not.toEqual(sunken);
    expect(surface).not.toEqual(floating);
  });

  it("forwards unrelated props through to the element", () => {
    render(<Card aria-label="Project">x</Card>);
    expect(screen.getByLabelText("Project")).toBeInTheDocument();
  });
});
