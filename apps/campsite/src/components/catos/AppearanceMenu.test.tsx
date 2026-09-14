import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSessionStore, type Appearance } from "../../store/sessionStore";
import AppearanceMenu from "./AppearanceMenu";

vi.mock("../../audio/soundEffects", () => ({ playSoftClick: vi.fn() }));

const osPrefersDark = (matches: boolean) =>
  vi.mocked(window.matchMedia).mockReturnValue({
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList);

const pick = (appearance: Appearance) => useSessionStore.setState({ appearance });

const openMenu = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /^Appearance/ }));
  await screen.findByRole("group", { name: "Appearance" });
  return user;
};

describe("AppearanceMenu", () => {
  beforeEach(() => {
    pick("system");
    osPrefersDark(false);
  });

  it("names the trigger by the scheme in effect, not the choice", () => {
    osPrefersDark(true);
    render(<AppearanceMenu />);
    expect(screen.getByRole("button", { name: "Appearance — dark" })).toBeInTheDocument();
  });

  it("ticks the current choice", async () => {
    pick("dark");
    render(<AppearanceMenu />);
    await openMenu();
    expect(screen.getByRole("menuitemradio", { name: "Dark", checked: true })).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemradio", { name: "System", checked: false }),
    ).toBeInTheDocument();
  });

  it("writes a pick to the session, and the trigger follows it", async () => {
    render(<AppearanceMenu />);
    const user = await openMenu();
    await user.click(screen.getByRole("menuitemradio", { name: "Dark" }));
    expect(useSessionStore.getState().appearance).toBe("dark");
    expect(screen.getByRole("button", { name: "Appearance — dark" })).toBeInTheDocument();
  });
});
