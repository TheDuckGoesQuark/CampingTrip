import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSessionStore, type Appearance } from "../store/sessionStore";
import { useColorScheme } from "./useColorScheme";

type ChangeHandler = (e: MediaQueryListEvent) => void;

function osPrefersDark(matches: boolean) {
  const listeners: ChangeHandler[] = [];
  vi.mocked(window.matchMedia).mockReturnValue({
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_: string, handler: ChangeHandler) => listeners.push(handler)),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList);
  return {
    flipTo: (dark: boolean) =>
      act(() => listeners.forEach((l) => l({ matches: dark } as MediaQueryListEvent))),
  };
}

const pick = (appearance: Appearance) => useSessionStore.setState({ appearance });

describe("useColorScheme", () => {
  beforeEach(() => pick("system"));

  it("follows the OS while nothing is picked", () => {
    osPrefersDark(true);
    expect(renderHook(useColorScheme).result.current).toBe("dark");
    osPrefersDark(false);
    expect(renderHook(useColorScheme).result.current).toBe("light");
  });

  it("follows the OS as it changes, without a reload", () => {
    const os = osPrefersDark(false);
    const { result } = renderHook(useColorScheme);
    os.flipTo(true);
    expect(result.current).toBe("dark");
  });

  it("lets a pick override the OS either way", () => {
    osPrefersDark(true);
    pick("light");
    expect(renderHook(useColorScheme).result.current).toBe("light");

    osPrefersDark(false);
    pick("dark");
    expect(renderHook(useColorScheme).result.current).toBe("dark");
  });
});
