import { afterEach, describe, expect, it, vi } from "vitest";

import { isHapticSwitch, resetHaptics, tick } from "./haptics";

afterEach(() => {
  vi.unstubAllGlobals();
  resetHaptics();
});

describe("tick", () => {
  it("vibrates briefly on the press where the browser can", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { ...navigator, vibrate });
    tick("press");
    tick("release");
    expect(vibrate).toHaveBeenCalledOnce();
    expect(vibrate.mock.calls[0][0]).toBeLessThanOrEqual(10);
  });

  it("toggles a hidden switch on the release where it cannot, as iOS Safari ticks for one", () => {
    vi.stubGlobal("navigator", { ...navigator, vibrate: undefined });
    tick("press");
    expect(document.querySelector("input[switch]")).toBeNull();
    tick("release");
    const toggle = document.querySelector<HTMLInputElement>("input[switch]");
    expect(toggle?.checked).toBe(true);
    expect(toggle?.closest("label")).toHaveAttribute("aria-hidden", "true");
  });

  it("hands focus back to whatever had it before the switch", () => {
    vi.stubGlobal("navigator", { ...navigator, vibrate: undefined });
    const game = document.createElement("div");
    game.tabIndex = 0;
    document.body.append(game);
    game.focus();
    tick("release");
    expect(document.activeElement).toBe(game);
    expect(isHapticSwitch(document.querySelector("input[switch]"))).toBe(true);
    expect(isHapticSwitch(game)).toBe(false);
    game.remove();
  });
});
