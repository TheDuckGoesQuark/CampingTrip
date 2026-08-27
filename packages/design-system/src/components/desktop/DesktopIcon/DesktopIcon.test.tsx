import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DesktopIcon } from "./DesktopIcon";

describe("DesktopIcon", () => {
  it("renders the label and fires onClick", async () => {
    const onClick = vi.fn();
    render(<DesktopIcon label="Projects" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: /Projects/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows a New badge only when isNew", () => {
    const { rerender } = render(<DesktopIcon label="A" />);
    expect(screen.queryByText("New")).toBeNull();
    rerender(<DesktopIcon label="A" isNew />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("falls back to a letter tile when no icon is given", () => {
    render(<DesktopIcon label="Zebra" />);
    expect(screen.getByText("Z")).toBeInTheDocument();
  });
  it("prefers a glyph to a letter tile when there is no image", () => {
    const { container } = render(<DesktopIcon label="notes.txt" glyph="document" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.textContent).not.toContain("N");
  });

  it("falls back to the label's initial when given neither image nor glyph", () => {
    const { container } = render(<DesktopIcon label="notes.txt" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.textContent).toContain("N");
  });
});
