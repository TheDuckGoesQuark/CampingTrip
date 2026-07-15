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
});
