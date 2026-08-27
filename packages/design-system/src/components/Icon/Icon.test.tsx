import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Icon, ICON_NAMES } from "./Icon";

describe("Icon", () => {
  it("renders every name in the set with a path", () => {
    const { container } = render(
      <>
        {ICON_NAMES.map((name) => (
          <Icon key={name} name={name} />
        ))}
      </>,
    );
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(ICON_NAMES.length);
    for (const path of paths) {
      expect(path.getAttribute("d")?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("hides itself from assistive tech when it has no label", () => {
    const { container } = render(<Icon name="globe" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
  });

  it("announces itself as an image when labelled", () => {
    render(<Icon name="trash" label="Move to bin" />);
    const svg = screen.getByRole("img", { name: "Move to bin" });
    expect(svg).not.toHaveAttribute("aria-hidden");
  });

  it("applies a distinct class per size", () => {
    const { container } = render(
      <>
        <Icon name="plus" size="sm" />
        <Icon name="plus" size="lg" />
      </>,
    );
    // An SVG's `className` is an SVGAnimatedString, so read the attribute.
    const [small, large] = Array.from(container.querySelectorAll("svg"));
    expect(small.getAttribute("class")).not.toEqual(large.getAttribute("class"));
  });
});
