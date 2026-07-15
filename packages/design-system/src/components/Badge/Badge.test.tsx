import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies a class for the variant/tone combo", () => {
    render(
      <Badge variant="solid" tone="danger">
        Alert
      </Badge>,
    );
    // cva compound variant resolved to a (non-empty) class string.
    expect(screen.getByText("Alert").className.trim().length).toBeGreaterThan(0);
  });
});
