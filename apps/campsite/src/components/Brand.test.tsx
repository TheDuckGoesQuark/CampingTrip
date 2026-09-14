import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useSceneStore } from "../store/sceneStore";
import { useSessionStore } from "../store/sessionStore";
import Brand from "./Brand";

const theme = () => document.documentElement.getAttribute("data-theme");

describe("Brand", () => {
  beforeEach(() => {
    useSceneStore.setState({ laptopFocused: false });
    useSessionStore.setState({ appearance: "dark" });
  });

  it("wears the dark scheme while CatOS is up", () => {
    useSceneStore.setState({ laptopFocused: true });
    render(<Brand>hi</Brand>);
    expect(theme()).toBe("dark");
  });

  it("leaves the tent light whatever CatOS is set to", () => {
    render(<Brand>hi</Brand>);
    expect(theme()).toBeNull();
  });

  it("takes the scheme off again on leaving CatOS", () => {
    useSceneStore.setState({ laptopFocused: true });
    render(<Brand>hi</Brand>);
    act(() => useSceneStore.setState({ laptopFocused: false }));
    expect(theme()).toBeNull();
  });
});
