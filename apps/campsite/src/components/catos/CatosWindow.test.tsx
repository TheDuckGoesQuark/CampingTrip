import { BrandProvider } from "@jordanscamp/ds";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { BlogPage } from "../../data/blogPages";
import { findDesktopItem } from "../../data/desktopItems";
import CatosWindow from "./CatosWindow";

vi.mock("../../audio/soundEffects", () => ({
  playWindowOpen: vi.fn(),
  playSoftClick: vi.fn(),
}));

const Wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <BrandProvider>{children}</BrandProvider>
  </MemoryRouter>
);

const deskPage = (slug: string): BlogPage => {
  const item = findDesktopItem(slug);
  if (!item) throw new Error(`no desktop item "${slug}"`);
  return { kind: "desk", item };
};

const renderWindow = (page: BlogPage) =>
  render(<CatosWindow page={page} onClose={() => {}} />, { wrapper: Wrapper });

describe("CatosWindow", () => {
  it("gives the browser a tab strip and an address bar", () => {
    renderWindow({ kind: "home" });
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New tab" })).toBeInTheDocument();
  });

  describe("a viewer is the same frame without the browser's chrome", () => {
    it("Preview shows the image and its facts, and no tabs or address bar", () => {
      renderWindow(deskPage("smittens-047-jpg"));
      expect(
        screen.getByRole("img", { name: /cat sitting in a tent doorway/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/2048 × 1365/)).toBeInTheDocument();
      expect(screen.queryByRole("tablist")).toBeNull();
      expect(screen.queryByRole("button", { name: "New tab" })).toBeNull();
    });

    it("Preview's zoom and paging controls render disabled rather than lying", () => {
      renderWindow(deskPage("smittens-047-jpg"));
      for (const name of ["Zoom in", "Zoom out", "Next image", "Previous image"]) {
        expect(screen.getByRole("button", { name })).toBeDisabled();
      }
    });

    it("a text window shows the file's body verbatim, newlines included", () => {
      renderWindow(deskPage("notes-txt"));
      expect(screen.getByText(/do not touch 0\.37/)).toBeInTheDocument();
      expect(screen.getByText(/oat milk/)).toBeInTheDocument();
      expect(screen.queryByRole("tablist")).toBeNull();
    });

    it("DO_NOT_OPEN.txt pays off", () => {
      renderWindow(deskPage("do-not-open-txt"));
      expect(screen.getByText("Told you.")).toBeInTheDocument();
    });

    it("the bin lists its contents and offers no way to empty it", () => {
      renderWindow(deskPage("bin"));
      expect(screen.getByText("tailwind.config.js")).toBeInTheDocument();
      expect(screen.getByText(/4 items/)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /empty/i })).toBeNull();
    });
  });

  it("renders nothing for a launcher, which opens something else rather than being a window", () => {
    const { container } = renderWindow(deskPage("catnav"));
    // BrandProvider's wrapper is what renders; nothing goes inside it.
    expect(container.firstElementChild).toBeEmptyDOMElement();
  });

  it("routes every window's red light to the same handler", async () => {
    const onClose = vi.fn();
    render(<CatosWindow page={deskPage("bin")} onClose={onClose} />, { wrapper: Wrapper });
    screen.getByRole("button", { name: "Close" }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
