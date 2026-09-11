import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

import { useSessionStore } from "../../store/sessionStore";
import VolumeSlider from "./VolumeSlider";

const setLevel = (percent: number) =>
  fireEvent.change(screen.getByRole("slider", { name: "Volume" }), {
    target: { value: String(percent) },
  });

describe("VolumeSlider", () => {
  beforeEach(() => {
    useSessionStore.setState({ volume: 1 });
  });

  it("shows the stored level as a percentage", () => {
    useSessionStore.setState({ volume: 0.4 });
    render(<VolumeSlider />);
    expect(screen.getByRole("slider", { name: "Volume" })).toHaveValue("40");
  });

  it("writes a dragged level back as a fraction", () => {
    render(<VolumeSlider />);
    setLevel(60);
    expect(useSessionStore.getState().volume).toBe(0.6);
  });

  it("reaches silence, which is how it mutes", () => {
    render(<VolumeSlider />);
    setLevel(0);
    expect(useSessionStore.getState().volume).toBe(0);
  });

  it("announces the level as a percentage, which a bare range does not", () => {
    useSessionStore.setState({ volume: 0.75 });
    render(<VolumeSlider />);
    expect(screen.getByRole("slider", { name: "Volume" })).toHaveAttribute("aria-valuetext", "75%");
  });
});
