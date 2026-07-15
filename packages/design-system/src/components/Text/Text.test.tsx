import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Text } from "./Text";

describe("Text", () => {
  it("renders titles as heading elements by default", () => {
    render(<Text variant="title-2">Camp</Text>);
    expect(screen.getByRole("heading", { level: 2, name: "Camp" })).toBeInTheDocument();
  });

  it("honours the `as` override", () => {
    render(
      <Text variant="title-1" as="span">
        Inline
      </Text>,
    );
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.getByText("Inline").tagName).toBe("SPAN");
  });

  it("renders body text as a paragraph", () => {
    render(<Text>Body</Text>);
    expect(screen.getByText("Body").tagName).toBe("P");
  });
});
