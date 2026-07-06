import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { INTERACTABLES } from "../../data/interactables";
import { useInteractionStore } from "../../store/interactionStore";
import { useSceneStore } from "../../store/sceneStore";
import InteractionOverlay from "./InteractionOverlay";

describe("InteractionOverlay", () => {
  beforeEach(() => {
    useInteractionStore.setState({ hoveredId: null, focusedId: null });
    useSceneStore.setState({ laptopFocused: false });
  });

  it("renders a toolbar with accessible label", () => {
    render(<InteractionOverlay />);
    const toolbar = screen.getByRole("toolbar");
    expect(toolbar).toBeInTheDocument();
    expect(toolbar).toHaveAttribute("aria-label", "Interactive objects in tent scene");
  });

  it("renders a button per interactable plus the skip link", () => {
    render(<InteractionOverlay />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(INTERACTABLES.length + 1);
    expect(screen.getByText("Skip to blog")).toBeInTheDocument();
  });

  it("labels every interactable button and makes it tabbable", () => {
    render(<InteractionOverlay />);
    for (const item of INTERACTABLES) {
      const btn = screen.getByLabelText(item.label);
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute("tabindex", "0");
    }
  });

  it("sets and clears focused ID on focus/blur", () => {
    render(<InteractionOverlay />);
    const guitarBtn = screen.getByLabelText("Guitar");
    fireEvent.focus(guitarBtn);
    expect(useInteractionStore.getState().focusedId).toBe("guitar");
    fireEvent.blur(guitarBtn);
    expect(useInteractionStore.getState().focusedId).toBeNull();
  });

  it("dispatches scene-activate on Enter for actionable objects", () => {
    render(<InteractionOverlay />);
    const handler = vi.fn();
    window.addEventListener("scene-activate", handler);

    fireEvent.keyDown(screen.getByLabelText("Guitar"), { key: "Enter" });
    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({ id: "guitar" });

    window.removeEventListener("scene-activate", handler);
  });

  it("does NOT dispatch for informational-only objects", () => {
    render(<InteractionOverlay />);
    const handler = vi.fn();
    window.addEventListener("scene-activate", handler);

    fireEvent.keyDown(screen.getByLabelText(/Moka pot/), { key: "Enter" });
    fireEvent.keyDown(screen.getByLabelText(/Scarlett/), { key: " " });
    expect(handler).not.toHaveBeenCalled();

    window.removeEventListener("scene-activate", handler);
  });

  it("skip link opens the blog", () => {
    render(<InteractionOverlay />);
    fireEvent.click(screen.getByText("Skip to blog"));
    expect(useSceneStore.getState().laptopFocused).toBe(true);
  });
});
