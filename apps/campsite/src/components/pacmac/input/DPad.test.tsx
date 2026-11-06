import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DPad from "./DPad";

describe("DPad", () => {
  it("holds a turn on the press, not the release", () => {
    const onHold = vi.fn();
    render(<DPad queued={null} onHold={onHold} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: "up" }));
    expect(onHold).toHaveBeenCalledExactlyOnceWith("up");
  });

  it("keeps the press from taking focus off the game", () => {
    render(<DPad queued={null} onHold={() => {}} />);
    const press = fireEvent.pointerDown(screen.getByRole("button", { name: "left" }));
    expect(press).toBe(false);
  });

  it("lights the arm of the turn being held, and only that one", () => {
    render(<DPad queued="right" onHold={() => {}} />);
    expect(screen.getByRole("button", { name: "right" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "up" })).toHaveAttribute("aria-pressed", "false");
  });

  it("answers a keyboard's click, which has no pointer behind it", () => {
    const onHold = vi.fn();
    render(<DPad queued={null} onHold={onHold} />);
    fireEvent.click(screen.getByRole("button", { name: "down" }), { detail: 0 });
    fireEvent.click(screen.getByRole("button", { name: "down" }), { detail: 1 });
    expect(onHold).toHaveBeenCalledExactlyOnceWith("down");
  });
});
