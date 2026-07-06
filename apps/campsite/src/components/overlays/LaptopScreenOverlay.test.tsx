import { BrandProvider } from "@jordanscamp/ds";
import { render, screen, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useSceneStore } from "../../store/sceneStore";
import LaptopScreenOverlay from "./LaptopScreenOverlay";

const Wrapper = ({ children }: { children: ReactNode }) => (
  <BrandProvider>{children}</BrandProvider>
);
const renderOverlay = () => render(<LaptopScreenOverlay />, { wrapper: Wrapper });

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
    vi.useFakeTimers();
    useSceneStore.setState({ laptopFocused: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when laptop is not focused", () => {
    renderOverlay();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mounts CatOS desktop when laptop becomes focused", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderOverlay();

    expect(screen.getByText("CatOS")).toBeInTheDocument();
  });

  it("fades in after 650ms delay", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderOverlay();

    const overlay = screen.getByRole("dialog");
    expect(overlay.style.opacity).toBe("0");

    act(() => {
      vi.advanceTimersByTime(650);
    });

    expect(overlay.style.opacity).toBe("1");
  });

  it("shows menu bar with CatOS branding", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderOverlay();

    expect(screen.getByText("CatOS")).toBeInTheDocument();
    expect(screen.getByText("Finder", { exact: true })).toBeInTheDocument();
  });

  it("shows back to tent button", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderOverlay();

    expect(screen.getByText(/Back to tent/)).toBeInTheDocument();
  });

  it("shows Esc hint on back button", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderOverlay();

    expect(screen.getByText("Esc")).toBeInTheDocument();
  });

  it("renders project desktop icons", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderOverlay();

    // Projects from data/projects.ts
    expect(screen.getByText("Camping Trip")).toBeInTheDocument();
  });

  it("renders dock with standard icons", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderOverlay();

    expect(screen.getByTitle("Finder")).toBeInTheDocument();
    expect(screen.getByTitle("Terminal")).toBeInTheDocument();
    expect(screen.getByTitle("Notes")).toBeInTheDocument();
    expect(screen.getByTitle("Trash")).toBeInTheDocument();
  });
});
