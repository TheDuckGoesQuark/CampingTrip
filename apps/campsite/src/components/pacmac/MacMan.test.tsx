import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MacMan from "./MacMan";

describe("MacMan", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const game = () => screen.getByRole("application");

  it("takes the keyboard as soon as it opens", () => {
    render(<MacMan />);
    expect(game()).toHaveFocus();
  });

  it("starts on Space, shows READY!, then plays and scores", () => {
    render(<MacMan />);
    fireEvent.keyDown(game(), { key: " " });
    expect(screen.getByText("READY!")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(4100));
    expect(screen.queryByText("READY!")).not.toBeInTheDocument();

    // From the spawn he heads left into a row of pellets.
    act(() => vi.advanceTimersByTime(1000));
    expect(Number(screen.getByText(/^\d+$/).textContent)).toBeGreaterThan(0);
  });

  it("pauses when it loses focus mid-game, and resumes on Space", () => {
    render(<MacMan />);
    fireEvent.keyDown(game(), { key: " " });
    act(() => vi.advanceTimersByTime(4100));
    fireEvent.blur(game());
    expect(screen.getByText("PAUSED")).toBeInTheDocument();
    fireEvent.keyDown(game(), { key: " " });
    expect(screen.queryByText("PAUSED")).not.toBeInTheDocument();
  });

  it("keeps the arrows from scrolling the window", () => {
    render(<MacMan />);
    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    game().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
