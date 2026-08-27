import { BrandProvider } from "@jordanscamp/ds";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { applyOverlayState } from "../../routing/overlays";
import { WINDOW_BROWSER } from "../../routing/windows";
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
    useSceneStore.setState({
      laptopFocused: false,
      openWindows: [],
      browserPath: null,
      openBlogPaths: [],
    });
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

  describe("the desktop's junk drawer", () => {
    it("opens a desktop item at its own URL", () => {
      useSceneStore.setState({ laptopFocused: true });
      renderWithPath();
      fireEvent.click(screen.getByRole("button", { name: /notes\.txt/ }));
      expect(currentPath()).toBe("/blog/desk/notes-txt");
    });

    it("shows a desktop item in a window with no browser chrome", () => {
      useSceneStore.setState({
        laptopFocused: true,
        openWindows: ["/blog/desk/notes-txt"],
      });
      renderOverlay();
      expect(screen.getByText(/oat milk/)).toBeInTheDocument();
      expect(screen.queryByRole("tablist")).toBeNull();
    });

    it("keeps a desktop item out of the browser's tab strip", () => {
      useSceneStore.setState({
        laptopFocused: true,
        openWindows: [WINDOW_BROWSER],
        openBlogPaths: [HOME],
        browserPath: HOME,
      });
      renderOverlay();
      applyOverlayState("laptop", "/blog/desk/bin");
      expect(useSceneStore.getState().openBlogPaths).toEqual([HOME]);
    });
  });

  describe("the browser window", () => {
    const openTabs = (paths: string[], active: string) =>
      useSceneStore.setState({
        laptopFocused: true,
        openWindows: [WINDOW_BROWSER],
        openBlogPaths: paths,
        browserPath: active,
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
  describe("several windows at once", () => {
    const NOTES = "/blog/desk/notes-txt";
    const BIN = "/blog/desk/bin";

    const openStack = (ids: string[], browserPath: string | null = null) =>
      useSceneStore.setState({
        laptopFocused: true,
        openWindows: ids,
        browserPath,
        openBlogPaths: browserPath ? [browserPath] : [],
      });

    it("renders every open window", () => {
      openStack([WINDOW_BROWSER, NOTES], HOME);
      renderOverlay();
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getByText(/oat milk/)).toBeInTheDocument();
    });

    it("paints them back to front, so the last one is on top", () => {
      openStack([NOTES, BIN]);
      renderOverlay();
      // Queried from the document: the takeover is portalled out of the container.
      const titles = Array.from(document.querySelectorAll('[class*="_title_"]')).map(
        (el) => el.textContent,
      );
      expect(titles).toEqual(["notes.txt", "Bin"]);
    });

    it("skips a window whose content no longer resolves", () => {
      openStack([NOTES, "/blog/desk/not-a-thing"]);
      renderOverlay();
      expect(screen.getAllByRole("button", { name: "Close" })).toHaveLength(1);
    });

    it("closing the front window hands the address to the one behind it", () => {
      openStack([NOTES, BIN]);
      renderWithPath();
      // Two windows, so two red lights; the front one is last in the DOM.
      const lights = screen.getAllByRole("button", { name: "Close" });
      fireEvent.click(lights[lights.length - 1]);
      expect(useSceneStore.getState().openWindows).toEqual([NOTES]);
      expect(currentPath()).toBe(NOTES);
    });

    it("closing the last window returns to the empty desktop", () => {
      openStack([NOTES]);
      renderWithPath();
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(currentPath()).toBe("/blog");
    });

    it("closing the browser ends the browsing session, tab strip included", () => {
      openStack([WINDOW_BROWSER, NOTES], HOME);
      renderWithPath();
      const lights = screen.getAllByRole("button", { name: "Close" });
      fireEvent.click(lights[0]);
      const state = useSceneStore.getState();
      expect(state.openWindows).toEqual([NOTES]);
      expect(state.openBlogPaths).toEqual([]);
      expect(state.browserPath).toBeNull();
    });

    it("a press on a window behind raises it, without adding to history", () => {
      openStack([NOTES, BIN]);
      renderWithPath();
      // The rearmost window's title bar; a press anywhere in the frame raises it.
      const titleBars = screen.getAllByRole("button", { name: "Close" });
      fireEvent.pointerDown(titleBars[0]);
      expect(currentPath()).toBe(NOTES);
    });

    it("a press on the front window changes nothing", () => {
      openStack([NOTES, BIN]);
      renderWithPath();
      const before = currentPath();
      const lights = screen.getAllByRole("button", { name: "Close" });
      fireEvent.pointerDown(lights[lights.length - 1]);
      expect(currentPath()).toBe(before);
    });
  });
});
