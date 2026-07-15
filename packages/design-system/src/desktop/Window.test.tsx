import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { BrandProvider } from "../BrandProvider";
import { Window } from "./Window";

const wrap = (ui: ReactNode) => render(<BrandProvider>{ui}</BrandProvider>);

describe("Window", () => {
  it("renders the title and content", () => {
    wrap(
      <Window title="About">
        <p>hello</p>
      </Window>,
    );
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("calls onClose from the red traffic light", async () => {
    const onClose = vi.fn();
    wrap(
      <Window title="About" onClose={onClose}>
        <p>hello</p>
      </Window>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("only the red light is interactive", () => {
    wrap(
      <Window title="About" onClose={() => {}}>
        <p>hello</p>
      </Window>,
    );
    // Red = the single enabled "Close" button; amber/green are decorative/disabled.
    expect(
      screen.getAllByRole("button").filter((b) => !(b as HTMLButtonElement).disabled),
    ).toHaveLength(1);
  });
});
