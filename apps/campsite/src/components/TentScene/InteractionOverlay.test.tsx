import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useMusicStore } from "../../store/musicStore";
import { useSceneStore } from "../../store/sceneStore";
import InteractionOverlay from "./InteractionOverlay";

describe("InteractionOverlay", () => {
  beforeEach(() => {
    useSceneStore.setState({ laptopFocused: false, notepadFocused: false });
    useMusicStore.setState({ isOpen: false });
  });

  it("exposes a polite live region", () => {
    render(<InteractionOverlay />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("does not render tabbable buttons for the scene objects", () => {
    render(<InteractionOverlay />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("announces which overlay opened", () => {
    useSceneStore.setState({ laptopFocused: true });
    render(<InteractionOverlay />);
    expect(screen.getByRole("status")).toHaveTextContent("Blog opened");
  });
});
