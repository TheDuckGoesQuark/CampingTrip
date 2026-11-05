import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { isKonami, KONAMI, remember, useKonamiCode } from "./useKonamiCode";

const type = (keys: readonly string[], target: EventTarget = window) => {
  for (const key of keys) {
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  }
};

describe("remember and isKonami", () => {
  it("match the code typed in full, in either case", () => {
    const recent = [...KONAMI.slice(0, 8), "B", "A"].reduce(remember, [] as string[]);
    expect(isKonami(recent)).toBe(true);
  });

  it("still match after a stray extra Up at the start", () => {
    const recent = ["ArrowUp", ...KONAMI].reduce(remember, [] as string[]);
    expect(isKonami(recent)).toBe(true);
  });

  it("do not match a near miss", () => {
    const recent = [...KONAMI.slice(0, 9), "b"].reduce(remember, [] as string[]);
    expect(isKonami(recent)).toBe(false);
  });
});

describe("useKonamiCode", () => {
  it("calls back once the code is typed", () => {
    const onCode = vi.fn();
    renderHook(() => useKonamiCode(true, onCode));
    type(KONAMI.slice(0, 9));
    expect(onCode).not.toHaveBeenCalled();
    type(["a"]);
    expect(onCode).toHaveBeenCalledOnce();
  });

  it("leaves every key's default alone", () => {
    renderHook(() => useKonamiCode(true, vi.fn()));
    const event = new KeyboardEvent("keydown", { key: "ArrowUp", cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("ignores keys typed into a field", () => {
    const onCode = vi.fn();
    renderHook(() => useKonamiCode(true, onCode));
    const field = document.createElement("textarea");
    document.body.append(field);
    type(KONAMI, field);
    expect(onCode).not.toHaveBeenCalled();
    field.remove();
  });

  it("hears keys even where a handler stops them", () => {
    const onCode = vi.fn();
    renderHook(() => useKonamiCode(true, onCode));
    const menu = document.createElement("button");
    menu.addEventListener("keydown", (event) => event.stopPropagation());
    document.body.append(menu);
    type(KONAMI, menu);
    menu.remove();
    expect(onCode).toHaveBeenCalledOnce();
  });

  it("closes a menu the code's arrows opened, with the Escape a visitor would press", () => {
    renderHook(() => useKonamiCode(true, vi.fn()));
    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    const item = document.createElement("button");
    menu.append(item);
    document.body.append(menu);
    const escapes = vi.fn();
    item.addEventListener("keydown", (event) => event.key === "Escape" && escapes());
    type(KONAMI, item);
    menu.remove();
    expect(escapes).toHaveBeenCalledOnce();
  });

  it("ignores keys aimed at the game", () => {
    const onCode = vi.fn();
    renderHook(() => useKonamiCode(true, onCode));
    const game = document.createElement("div");
    game.setAttribute("role", "application");
    document.body.append(game);
    type(KONAMI, game);
    game.remove();
    expect(onCode).not.toHaveBeenCalled();
  });

  it("listens only while armed", () => {
    const onCode = vi.fn();
    renderHook(() => useKonamiCode(false, onCode));
    type(KONAMI);
    expect(onCode).not.toHaveBeenCalled();
  });
});
