import { BrandProvider } from "@jordanscamp/ds";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSceneStore } from "../../store/sceneStore";
import LaptopScreenOverlay from "./LaptopScreenOverlay";

const HOME = "/blog/index.html";
const CAMPING_TRIP = "/blog/projects/camping-trip.html";
const CATMAP = "/blog/projects/catmap.html";
const MUSIC_TAG = "/blog/tags/music.html";

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
    useSceneStore.setState({ laptopFocused: false, activeBlogPath: null, openBlogPaths: [] });
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
  });

  it("shows the back-to-tent button with an Esc hint", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderOverlay();
    expect(screen.getByText(/Back to tent/)).toBeInTheDocument();
    expect(screen.getByText("Esc")).toBeInTheDocument();
  });

  it("launches CatNav from the desktop rather than listing content there", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderWithPath();
    expect(screen.queryByText("Camping Trip")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /CatNav/ }));
    expect(currentPath()).toBe(HOME);
  });

  describe("the browser window", () => {
    const openTabs = (paths: string[], active: string) =>
      useSceneStore.setState({
        laptopFocused: true,
        openBlogPaths: paths,
        activeBlogPath: active,
      });

    it("stays shut while nothing is open", () => {
      useSceneStore.setState({ laptopFocused: true });
      renderOverlay();
      expect(screen.queryByRole("tab")).toBeNull();
    });

    it("shows the active page's route as the displayed address", () => {
      openTabs([HOME], HOME);
      renderOverlay();
      expect(screen.getByText(`https://jordanscamp.site${HOME}`)).toBeInTheDocument();
    });

    it("renders one tab per open page, marking the active one", () => {
      openTabs([CAMPING_TRIP, CATMAP], CATMAP);
      renderOverlay();
      expect(screen.getAllByRole("tab")).toHaveLength(2);
      expect(screen.getByRole("tab", { name: /CatMap/ })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tab", { name: /Camping Trip/ })).toHaveAttribute(
        "aria-selected",
        "false",
      );
    });

    it("titles a tag tab by its tag", () => {
      openTabs([MUSIC_TAG], MUSIC_TAG);
      renderOverlay();
      expect(screen.getByRole("tab", { name: /Tag: music/ })).toBeInTheDocument();
    });

    it("skips a path that names nothing that exists", () => {
      openTabs([CATMAP, "/blog/posts/not-a-real-post.html"], CATMAP);
      renderOverlay();
      expect(screen.getAllByRole("tab")).toHaveLength(1);
    });

    it("drops a background tab from the strip without changing the address", () => {
      openTabs([CAMPING_TRIP, CATMAP], CATMAP);
      renderOverlay();
      fireEvent.click(screen.getByRole("button", { name: "Close Camping Trip" }));
      expect(useSceneStore.getState().openBlogPaths).toEqual([CATMAP]);
      expect(screen.getByText(`https://jordanscamp.site${CATMAP}`)).toBeInTheDocument();
    });

    // Discarding the strip is applyOverlayState's job, covered in
    // routing/overlays.test.ts; the window's own job is to navigate there.
    it("closing the whole window navigates back to the bare blog route", () => {
      openTabs([CAMPING_TRIP, CATMAP], CATMAP);
      renderWithPath();
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(currentPath()).toBe("/blog");
    });

    it("closing the last remaining tab navigates back to the bare blog route", () => {
      openTabs([CATMAP], CATMAP);
      renderWithPath();
      fireEvent.click(screen.getByRole("button", { name: "Close CatMap" }));
      expect(currentPath()).toBe("/blog");
    });

    it("closing the active tab hands focus to its neighbour", () => {
      openTabs([CAMPING_TRIP, CATMAP], CATMAP);
      renderWithPath();
      fireEvent.click(screen.getByRole("button", { name: "Close CatMap" }));
      expect(currentPath()).toBe(CAMPING_TRIP);
    });

    it("the new-tab control opens the homepage, keeping the strip intact", () => {
      openTabs([CAMPING_TRIP, CATMAP], CATMAP);
      renderWithPath();
      fireEvent.click(screen.getByRole("button", { name: "New tab" }));
      expect(currentPath()).toBe(HOME);
      expect(useSceneStore.getState().openBlogPaths).toEqual([CAMPING_TRIP, CATMAP]);
    });

    it("the red light discards the strip, ending the browsing session", () => {
      openTabs([CAMPING_TRIP, CATMAP], CATMAP);
      renderWithPath();
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(useSceneStore.getState().openBlogPaths).toEqual([]);
    });

    it("selecting a background tab navigates to its route", () => {
      openTabs([CAMPING_TRIP, CATMAP], CATMAP);
      renderWithPath();
      fireEvent.click(screen.getByRole("tab", { name: /Camping Trip/ }));
      expect(currentPath()).toBe(CAMPING_TRIP);
    });
  });
});
