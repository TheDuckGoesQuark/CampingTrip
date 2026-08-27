import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Link } from "./Link";

describe("Link", () => {
  it("renders an anchor with href", () => {
    render(<Link href="https://example.com">Visit</Link>);
    expect(screen.getByRole("link", { name: "Visit" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });
  it("becomes the given element when passed `render`", () => {
    render(<Link render={<button type="button" />}>Routed</Link>);
    const routed = screen.getByRole("button", { name: "Routed" });
    expect(routed.className.trim().length).toBeGreaterThan(0);
  });
});
