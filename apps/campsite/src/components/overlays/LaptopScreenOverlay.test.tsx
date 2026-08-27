import { BrandProvider } from "@jordanscamp/ds";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useSceneStore } from "../../store/sceneStore";
import LaptopScreenOverlay from "./LaptopScreenOverlay";

const Wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <BrandProvider>{children}</BrandProvider>
  </MemoryRouter>
);
const renderOverlay = () => render(<LaptopScreenOverlay />, { wrapper: Wrapper });

/** Surfaces the router path, so a test can assert where a control navigated to. */
function PathProbe() {
  return <span data-testid="path">{useLocation().pathname}</span>;
}
const renderWithPath = () =>
  render(
    <>
      <LaptopScreenOverlay />
      <PathProbe />
    </>,
    { wrapper: Wrapper },
  );
const currentPath = () => screen.getByTestId("path").textContent;

// Mock the sound effects to avoid AudioContext issues
vi.mock("../../audio/soundEffects", () => ({
  playWindowOpen: vi.fn(),
  playSoftClick: vi.fn(),
  playLaptopOn: vi.fn(),
  playLaptopOff: vi.fn(),
  playMidiNote: vi.fn(),
  playGuitarStrum: vi.fn(),
  playCatMeow: vi.fn(),
}));

describe("LaptopScreenOverlay (CatOS)", () => {
  beforeEach(() => {
    useSceneStore.setState({ laptopFocused: false, activePostSlug: null, openPostSlugs: [] });
  });

  it("renders no dialog when the laptop is not focused", () => {
    renderOverlay();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mounts the CatOS takeover dialog when focused", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderOverlay();
    expect(screen.getByRole("dialog", { name: /CatOS/ })).toBeInTheDocument();
  });

  it("shows the menu bar branding", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderOverlay();
    expect(screen.getByText("CatOS")).toBeInTheDocument();
    expect(screen.getByText("Finder")).toBeInTheDocument();
  });

  it("shows the back-to-tent button with an Esc hint", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderOverlay();
    expect(screen.getByText(/Back to tent/)).toBeInTheDocument();
    expect(screen.getByText("Esc")).toBeInTheDocument();
  });

  it("renders project desktop icons", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderOverlay();
    expect(screen.getByText("Camping Trip")).toBeInTheDocument();
  });

  describe("the browser window", () => {
    const openTabs = (slugs: string[], active: string) =>
      useSceneStore.setState({
        laptopFocused: true,
        openPostSlugs: slugs,
        activePostSlug: active,
      });

    it("stays shut while no post is open", () => {
      useSceneStore.setState({ laptopFocused: true });
      renderOverlay();
      expect(screen.queryByRole("tab")).toBeNull();
    });

    it("shows the active post's route as the displayed address", () => {
      openTabs(["camping-trip"], "camping-trip");
      renderOverlay();
      expect(screen.getByText("https://jordanscamp.site/blog/camping-trip")).toBeInTheDocument();
    });

    it("renders one tab per open post, marking the active one", () => {
      openTabs(["camping-trip", "catmap"], "catmap");
      renderOverlay();
      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(2);
      expect(screen.getByRole("tab", { name: /CatMap/ })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tab", { name: /Camping Trip/ })).toHaveAttribute(
        "aria-selected",
        "false",
      );
    });

    it("skips a slug that matches no project or bookmark", () => {
      openTabs(["catmap", "not-a-real-post"], "catmap");
      renderOverlay();
      expect(screen.getAllByRole("tab")).toHaveLength(1);
    });

    it("drops a background tab from the strip without changing the address", () => {
      openTabs(["camping-trip", "catmap"], "catmap");
      renderOverlay();
      fireEvent.click(screen.getByRole("button", { name: "Close Camping Trip" }));
      expect(useSceneStore.getState().openPostSlugs).toEqual(["catmap"]);
      expect(screen.getByText("https://jordanscamp.site/blog/catmap")).toBeInTheDocument();
    });

    // Discarding the strip is applyOverlayState's job, covered in
    // routing/overlays.test.ts; the window's own job is to navigate there.
    it("closing the whole window navigates back to the bare blog route", () => {
      openTabs(["camping-trip", "catmap"], "catmap");
      renderWithPath();
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(currentPath()).toBe("/blog");
    });

    it("closing the last remaining tab navigates back to the bare blog route", () => {
      openTabs(["catmap"], "catmap");
      renderWithPath();
      fireEvent.click(screen.getByRole("button", { name: "Close CatMap" }));
      expect(currentPath()).toBe("/blog");
    });

    it("closing the active tab hands focus to its neighbour", () => {
      openTabs(["camping-trip", "catmap"], "catmap");
      renderWithPath();
      fireEvent.click(screen.getByRole("button", { name: "Close CatMap" }));
      expect(currentPath()).toBe("/blog/camping-trip");
    });

    it("the new-tab control shows the desktop with the strip intact", () => {
      openTabs(["camping-trip", "catmap"], "catmap");
      renderWithPath();
      fireEvent.click(screen.getByRole("button", { name: "New tab" }));
      expect(currentPath()).toBe("/blog");
      expect(useSceneStore.getState().openPostSlugs).toEqual(["camping-trip", "catmap"]);
    });

    it("the red light discards the strip, ending the browsing session", () => {
      openTabs(["camping-trip", "catmap"], "catmap");
      renderWithPath();
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(useSceneStore.getState().openPostSlugs).toEqual([]);
    });

    it("selecting a background tab navigates to its route", () => {
      openTabs(["camping-trip", "catmap"], "catmap");
      renderWithPath();
      fireEvent.click(screen.getByRole("tab", { name: /Camping Trip/ }));
      expect(currentPath()).toBe("/blog/camping-trip");
    });
  });
});
