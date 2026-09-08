import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Counter from "./Counter";

describe("Counter", () => {
  it("counts clicks", () => {
    render(<Counter />);
    expect(screen.getByText("Clicks: 0")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Click me" }));
    fireEvent.click(screen.getByRole("button", { name: "Click me" }));
    expect(screen.getByText("Clicks: 2")).toBeInTheDocument();
  });
});
