import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Window } from "./Window";

describe("Window", () => {
  it("renders title and content", () => {
    render(<Window title="About">hello</Window>);
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("closes from the red traffic light", async () => {
    const onClose = vi.fn();
    render(
      <Window title="About" onClose={onClose}>
        hello
      </Window>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
