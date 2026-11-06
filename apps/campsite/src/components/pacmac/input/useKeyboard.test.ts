import type { KeyboardEvent, MouseEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Actions } from "../engine/actions";
import { useKeyboard } from "./useKeyboard";

function between() {
  const start = vi.fn();
  const handlers = useKeyboard({ phase: "gameOver", start } as unknown as Actions);
  const form = document.createElement("form");
  const save = document.createElement("button");
  form.append(save);
  return { start, handlers, save };
}

describe("useKeyboard around the initials form", () => {
  it("leaves a tap on the save button to the form rather than starting a game", () => {
    const { start, handlers, save } = between();
    handlers.onClick({ target: save } as unknown as MouseEvent);
    expect(start).not.toHaveBeenCalled();
  });

  it("leaves Space on the save button to the form", () => {
    const { start, handlers, save } = between();
    const preventDefault = vi.fn();
    handlers.onKeyDown({ key: " ", target: save, preventDefault } as unknown as KeyboardEvent);
    expect(start).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("still starts a game on a tap anywhere else", () => {
    const { start, handlers } = between();
    handlers.onClick({ target: document.body } as unknown as MouseEvent);
    expect(start).toHaveBeenCalledOnce();
  });
});
