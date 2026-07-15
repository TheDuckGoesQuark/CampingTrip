import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MenuBar } from "./MenuBar";

describe("MenuBar", () => {
  it("renders left and right slots", () => {
    render(<MenuBar left={<span>CatOS</span>} right={<span>9:41</span>} />);
    expect(screen.getByText("CatOS")).toBeInTheDocument();
    expect(screen.getByText("9:41")).toBeInTheDocument();
  });
});
