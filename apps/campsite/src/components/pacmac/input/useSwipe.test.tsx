import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Dir } from "../engine/maze";
import { useSwipe } from "./useSwipe";

function Board({ onSwipe }: { onSwipe: (dir: Dir) => void }) {
  return <div data-testid="board" {...useSwipe(onSwipe)} />;
}

const at = (x: number, y: number) => ({
  changedTouches: [{ identifier: 0, clientX: x, clientY: y }],
});

describe("useSwipe", () => {
  it("asks for a turn as soon as the finger has moved far enough", () => {
    const onSwipe = vi.fn();
    render(<Board onSwipe={onSwipe} />);
    const board = screen.getByTestId("board");
    fireEvent.touchStart(board, at(100, 100));
    fireEvent.touchMove(board, at(105, 100));
    expect(onSwipe).not.toHaveBeenCalled();
    fireEvent.touchMove(board, at(130, 104));
    expect(onSwipe).toHaveBeenCalledExactlyOnceWith("right");
  });

  it("turns twice for one stroke round a corner, and once for a long straight one", () => {
    const onSwipe = vi.fn();
    render(<Board onSwipe={onSwipe} />);
    const board = screen.getByTestId("board");
    fireEvent.touchStart(board, at(100, 100));
    fireEvent.touchMove(board, at(130, 100));
    fireEvent.touchMove(board, at(160, 100));
    fireEvent.touchMove(board, at(160, 60));
    fireEvent.touchEnd(board, at(160, 60));
    expect(onSwipe.mock.calls).toEqual([["right"], ["up"]]);
  });
});
