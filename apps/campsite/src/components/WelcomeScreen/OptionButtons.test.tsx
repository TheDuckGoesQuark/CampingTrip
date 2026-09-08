import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

import { useSessionStore } from "../../store/sessionStore";
import OptionButtons from "./OptionButtons";

describe("OptionButtons", () => {
  beforeEach(() => {
    useSessionStore.setState({
      soundEnabled: true,
      ambienceEnabled: false,
      effectsEnabled: true,
      hasCompletedWelcome: false,
    });
  });

  it("renders two option buttons", () => {
    render(<OptionButtons visible={true} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });

  it("shows full experience and just browsing options", () => {
    render(<OptionButtons visible={true} />);
    expect(screen.getByText(/full experience/)).toBeInTheDocument();
    expect(screen.getByText(/just browsing/)).toBeInTheDocument();
  });

  it('"full experience" enables sound and effects, completes welcome', () => {
    render(<OptionButtons visible={true} />);
    const btn = screen.getByText(/full experience/);

    fireEvent.click(btn);

    const state = useSessionStore.getState();
    expect(state.soundEnabled).toBe(true);
    expect(state.ambienceEnabled).toBe(true);
    expect(state.effectsEnabled).toBe(true);
    expect(state.hasCompletedWelcome).toBe(true);
  });

  it('"full experience" turns the rain ambience on', () => {
    render(<OptionButtons visible={true} />);

    fireEvent.click(screen.getByText(/full experience/));

    expect(useSessionStore.getState().ambienceEnabled).toBe(true);
  });

  it('"just browsing" disables sound and effects, completes welcome', () => {
    render(<OptionButtons visible={true} />);
    const btn = screen.getByText(/just browsing/);

    fireEvent.click(btn);

    const state = useSessionStore.getState();
    expect(state.soundEnabled).toBe(false);
    expect(state.ambienceEnabled).toBe(false);
    expect(state.effectsEnabled).toBe(false);
    expect(state.hasCompletedWelcome).toBe(true);
  });
});
