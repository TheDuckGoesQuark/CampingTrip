import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

import { useSessionStore } from "../../store/sessionStore";
import SceneControls from "./SceneControls";

const RAIN = 0;
const SOUND = 1;
const VISUALS = 2;

describe("SceneControls", () => {
  beforeEach(() => {
    useSessionStore.setState({
      soundEnabled: true,
      ambienceEnabled: false,
      effectsEnabled: true,
      hasCompletedWelcome: false,
    });
  });

  it("renders the three cluster buttons", () => {
    render(<SceneControls />);
    expect(screen.getByLabelText("Turn visual effects off")).toBeInTheDocument();
    expect(screen.getByLabelText("Turn rain sound on")).toBeInTheDocument();
    expect(screen.getByLabelText("Settings")).toBeInTheDocument();
  });

  it("reflects each toggle's state via aria-pressed", () => {
    render(<SceneControls />);
    expect(screen.getByLabelText("Turn visual effects off")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Turn rain sound on")).toHaveAttribute("aria-pressed", "false");
  });

  it("the rain button turns ambience on, and its label follows", () => {
    render(<SceneControls />);

    fireEvent.click(screen.getByLabelText("Turn rain sound on"));

    expect(useSessionStore.getState().ambienceEnabled).toBe(true);
    expect(screen.getByLabelText("Turn rain sound off")).toBeInTheDocument();
  });

  it("the rain button does not touch the one-shot sound effects", () => {
    render(<SceneControls />);

    fireEvent.click(screen.getByLabelText("Turn rain sound on"));

    expect(useSessionStore.getState().soundEnabled).toBe(true);
  });

  it("the visual effects button toggles effects", () => {
    render(<SceneControls />);

    fireEvent.click(screen.getByLabelText("Turn visual effects off"));

    expect(useSessionStore.getState().effectsEnabled).toBe(false);
    expect(screen.getByLabelText("Turn visual effects on")).toBeInTheDocument();
  });

  it("gear button has aria-expanded=false initially", () => {
    render(<SceneControls />);
    expect(screen.getByLabelText("Settings")).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the popover on click", () => {
    render(<SceneControls />);
    const gear = screen.getByLabelText("Settings");

    fireEvent.click(gear);

    expect(gear).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Rain sound", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Sound effects", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Visual effects", { exact: false })).toBeInTheDocument();
  });

  it("closes the popover on second click", () => {
    render(<SceneControls />);
    const gear = screen.getByLabelText("Settings");

    fireEvent.click(gear);
    fireEvent.click(gear);

    expect(gear).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles rain from the popover", () => {
    render(<SceneControls />);
    fireEvent.click(screen.getByLabelText("Settings"));

    const rainSwitch = screen.getAllByRole("switch")[RAIN];
    expect(rainSwitch).toHaveAttribute("aria-checked", "false");

    fireEvent.click(rainSwitch);
    expect(useSessionStore.getState().ambienceEnabled).toBe(true);
  });

  it("toggles sound effects from the popover", () => {
    render(<SceneControls />);
    fireEvent.click(screen.getByLabelText("Settings"));

    const soundSwitch = screen.getAllByRole("switch")[SOUND];
    expect(soundSwitch).toHaveAttribute("aria-checked", "true");

    fireEvent.click(soundSwitch);
    expect(useSessionStore.getState().soundEnabled).toBe(false);
  });

  it("toggles visual effects from the popover", () => {
    render(<SceneControls />);
    fireEvent.click(screen.getByLabelText("Settings"));

    const effectsSwitch = screen.getAllByRole("switch")[VISUALS];
    expect(effectsSwitch).toHaveAttribute("aria-checked", "true");

    fireEvent.click(effectsSwitch);
    expect(useSessionStore.getState().effectsEnabled).toBe(false);
  });

  it("reset button resets welcome state", () => {
    useSessionStore.setState({ hasCompletedWelcome: true });

    render(<SceneControls />);
    fireEvent.click(screen.getByLabelText("Settings"));
    fireEvent.click(screen.getByText("Reset preferences"));

    expect(useSessionStore.getState().hasCompletedWelcome).toBe(false);
  });

  it("switch responds to Enter key", () => {
    render(<SceneControls />);
    fireEvent.click(screen.getByLabelText("Settings"));

    fireEvent.keyDown(screen.getAllByRole("switch")[SOUND], { key: "Enter" });
    expect(useSessionStore.getState().soundEnabled).toBe(false);
  });

  it("switch responds to Space key", () => {
    render(<SceneControls />);
    fireEvent.click(screen.getByLabelText("Settings"));

    fireEvent.keyDown(screen.getAllByRole("switch")[VISUALS], { key: " " });
    expect(useSessionStore.getState().effectsEnabled).toBe(false);
  });
});
