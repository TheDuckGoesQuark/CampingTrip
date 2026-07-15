import { BrandProvider } from "@jordanscamp/ds";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useSceneStore } from "../../store/sceneStore";
import LaptopScreenOverlay from "./LaptopScreenOverlay";

const Wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <BrandProvider>{children}</BrandProvider>
  </MemoryRouter>
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
    useSceneStore.setState({ laptopFocused: false, activePostSlug: null });
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
    // "Finder" appears in the menu bar and the dock tooltip — both are fine.
    expect(screen.getAllByText("Finder").length).toBeGreaterThan(0);
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

  it("renders the dock with standard icons", () => {
    useSceneStore.setState({ laptopFocused: true });
    renderOverlay();
    expect(screen.getByTitle("Finder")).toBeInTheDocument();
    expect(screen.getByTitle("Terminal")).toBeInTheDocument();
    expect(screen.getByTitle("Notes")).toBeInTheDocument();
    expect(screen.getByTitle("Trash")).toBeInTheDocument();
  });
});
