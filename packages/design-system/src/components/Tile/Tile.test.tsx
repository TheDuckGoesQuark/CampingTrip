import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tile } from "./Tile";

describe("Tile", () => {
  it("shows the label's first character, uppercased", () => {
    const { container } = render(<Tile label="camping trip" />);
    expect(container.firstElementChild?.textContent).toBe("C");
  });

  it("is hidden from assistive tech, since the label sits beside it", () => {
    const { container } = render(<Tile label="CatMap" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    // Absent once hidden elements are excluded, i.e. not read as a stray letter.
    expect(screen.queryByText("C", { ignore: "[aria-hidden='true']" })).toBeNull();
  });

  it("falls back to the brand fill when given no colour", () => {
    const { container } = render(<Tile label="CatMap" />);
    expect(container.firstElementChild?.getAttribute("style")).toContain("--brand-solid");
  });

  it("draws the image over the initial, with an empty alt since the label sits beside it", () => {
    const { container } = render(<Tile label="CatMap" icon="/logo.webp" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/logo.webp");
    expect(img).toHaveAttribute("alt", "");
    expect(container.firstElementChild?.textContent).toBe("");
  });

  it("draws the glyph when there is no image", () => {
    const { container } = render(<Tile label="Music" glyph="note" />);
    expect(container.querySelector("svg path")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.firstElementChild?.textContent).toBe("");
  });

  it("applies a distinct class per size", () => {
    const { container } = render(
      <>
        <Tile label="a" size="sm" />
        <Tile label="b" size="lg" />
      </>,
    );
    const [small, large] = Array.from(container.children);
    expect(small.className).not.toEqual(large.className);
  });
});
