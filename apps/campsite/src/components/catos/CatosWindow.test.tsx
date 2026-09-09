import { BrandProvider } from "@jordanscamp/ds";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BlogPage } from "../../data/blogPages";
import { findDesktopItem } from "../../data/desktopItems";
import { useSessionStore } from "../../store/sessionStore";
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

const playerSrc = () => new URL(screen.getByTitle("DO_NOT_OPEN.txt").getAttribute("src") ?? "");

const prefersReducedMotion = (reduced: boolean) => {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("prefers-reduced-motion") ? reduced : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
};

describe("CatosWindow", () => {
  // Text edits and the sound preference live in the persisted session store, so
  // they outlive a render.
  beforeEach(() => {
    useSessionStore.setState({ textEdits: {}, soundEnabled: true });
    prefersReducedMotion(false);
  });

  it("gives the browser a tab strip and an address bar", () => {
    renderWindow({ kind: "home" });
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New tab" })).toBeInTheDocument();
  });

  describe("a viewer is the same frame without the browser's chrome", () => {
    it("Preview shows the image and its facts, and no tabs or address bar", () => {
      renderWindow(deskPage("smittens-047-jpg"));
      expect(
        screen.getByRole("img", { name: /Smittens, a black-and-white cat/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/1600 × 1015/)).toBeInTheDocument();
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
      renderWindow(deskPage("words-with-friends-txt"));
      const body = screen.getByRole("textbox", { name: "words_with_friends.txt" });
      const value = (body as HTMLTextAreaElement).value;
      expect(value).toContain("- A fact becomes a lie if you leave it for long enough");
      expect(value).toContain("\n- These kids and their damn artichokes");
      expect(screen.queryByRole("tablist")).toBeNull();
    });

    it("DO_NOT_OPEN.txt pays off: a .txt that opens a player, not an editor", () => {
      renderWindow(deskPage("do-not-open-txt"));
      expect(screen.queryByRole("textbox", { name: "DO_NOT_OPEN.txt" })).toBeNull();
      expect(screen.getByTitle("DO_NOT_OPEN.txt")).toBeInTheDocument();
      expect(screen.getByText("Told you.")).toBeInTheDocument();
    });

    it("the player embeds from the no-cookie host, so a site with no consent banner stays honest", () => {
      renderWindow(deskPage("do-not-open-txt"));
      expect(playerSrc().origin).toBe("https://www.youtube-nocookie.com");
    });

    it("starts playing with sound the moment the window opens", () => {
      renderWindow(deskPage("do-not-open-txt"));
      const src = playerSrc();
      expect(src.searchParams.get("autoplay")).toBe("1");
      expect(src.searchParams.get("mute")).toBe("0");
    });

    it("keeps the video muted for a visitor who turned the scene's sound off", () => {
      useSessionStore.setState({ soundEnabled: false });
      renderWindow(deskPage("do-not-open-txt"));
      const src = playerSrc();
      expect(src.searchParams.get("autoplay")).toBe("1");
      expect(src.searchParams.get("mute")).toBe("1");
      expect(screen.getByText("Muted")).toBeInTheDocument();
    });

    it("does not autoplay for a visitor who asked for reduced motion", () => {
      prefersReducedMotion(true);
      renderWindow(deskPage("do-not-open-txt"));
      expect(playerSrc().searchParams.get("autoplay")).toBe("0");
    });

    it("leaves the player's own controls in place, so audio can always be stopped", () => {
      renderWindow(deskPage("do-not-open-txt"));
      // `controls=0` would hide the only pause button on the page (WCAG 1.4.2).
      expect(playerSrc().searchParams.get("controls")).not.toBe("0");
    });

    it("a text window can be typed into, and reverted back to the file on disk", () => {
      renderWindow(deskPage("words-with-friends-txt"));
      const body = screen.getByRole("textbox", { name: "words_with_friends.txt" });
      const original = (body as HTMLTextAreaElement).value;

      expect(screen.getByRole("button", { name: "Revert" })).toBeDisabled();
      fireEvent.change(body, { target: { value: "there is never a good reason to chug wine" } });
      expect(body).toHaveValue("there is never a good reason to chug wine");

      fireEvent.click(screen.getByRole("button", { name: "Revert" }));
      expect(body).toHaveValue(original);
      expect(screen.getByRole("button", { name: "Revert" })).toBeDisabled();
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
