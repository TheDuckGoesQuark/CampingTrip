import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { BrandProvider } from "../BrandProvider";
import { DesktopIcon } from "./DesktopIcon";

const wrap = (ui: ReactNode) => render(<BrandProvider>{ui}</BrandProvider>);

describe("DesktopIcon", () => {
  it("renders the label and fires onClick", async () => {
    const onClick = vi.fn();
    wrap(<DesktopIcon label="Projects" onClick={onClick} />);
    const button = screen.getByRole("button", { name: /Projects/ });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows a New badge only when isNew", () => {
    const { rerender } = wrap(<DesktopIcon label="A" />);
    expect(screen.queryByText("New")).toBeNull();
    rerender(
      <BrandProvider>
        <DesktopIcon label="A" isNew />
      </BrandProvider>,
    );
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("falls back to a letter tile when no icon is given", () => {
    wrap(<DesktopIcon label="Zebra" />);
    expect(screen.getByText("Z")).toBeInTheDocument();
  });
});
