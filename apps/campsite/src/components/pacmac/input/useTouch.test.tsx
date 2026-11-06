import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Actions } from "../engine/actions";
import { useTouch } from "./useTouch";

function Cabinet({
  actions,
  onStart = () => {},
  onBoardClick = () => {},
}: {
  actions: Actions;
  onStart?: () => void;
  onBoardClick?: () => void;
}) {
  const pad = useRef<HTMLDivElement>(null);
  return (
    <section data-testid="cabinet" {...useTouch(actions, { pad, onStart })}>
      {/* Handed in as the screen's are, from a hook. */}
      <div data-testid="board" {...{ onClick: onBoardClick }} />
      <div data-testid="pad" ref={pad} />
    </section>
  );
}

function playing() {
  const actions = { phase: "playing", move: vi.fn(), hold: vi.fn(), pause: vi.fn() };
  return actions as typeof actions & Actions;
}

/** The pad's area as a 200 by 100 box from (0, 400), so its centre is (100, 450). */
function placePad() {
  const pad = screen.getByTestId("pad");
  pad.getBoundingClientRect = () =>
    ({ left: 0, top: 400, width: 200, height: 100, right: 200, bottom: 500 }) as DOMRect;
  return pad;
}

const finger = (x: number, y: number) => ({
  pointerId: 1,
  pointerType: "touch",
  clientX: x,
  clientY: y,
});

function stroke(target: Element, points: [number, number][]) {
  const [first, ...rest] = points;
  fireEvent.pointerDown(target, finger(...first));
  for (const point of rest) fireEvent.pointerMove(target, finger(...point));
  fireEvent.pointerUp(target, finger(...(rest.at(-1) ?? first)));
}

describe("useTouch", () => {
  it("presses the arm a tap lands in, the pad's area cut into four by an X", () => {
    const actions = playing();
    render(<Cabinet actions={actions} />);
    const pad = placePad();
    stroke(pad, [[20, 470]]);
    stroke(pad, [[110, 410]]);
    expect(actions.hold.mock.calls).toEqual([["left"], ["up"]]);
  });

  it("takes a swipe that starts on the pad as the swipe, not the arm it started on", () => {
    const actions = playing();
    render(<Cabinet actions={actions} />);
    const pad = placePad();
    stroke(pad, [
      [20, 470],
      [20, 440],
      [20, 420],
    ]);
    expect(actions.hold.mock.calls).toEqual([["up"]]);
  });

  it("steers on a swipe anywhere, and again when the stroke turns a corner", () => {
    const actions = playing();
    render(<Cabinet actions={actions} />);
    stroke(screen.getByTestId("board"), [
      [100, 100],
      [140, 100],
      [140, 60],
    ]);
    expect(actions.hold.mock.calls).toEqual([["right"], ["up"]]);
  });

  it("never pauses on a tap, which a missed swipe would be", () => {
    const actions = playing();
    render(<Cabinet actions={actions} />);
    stroke(screen.getByTestId("board"), [[100, 100]]);
    expect(actions.pause).not.toHaveBeenCalled();
    expect(actions.hold).not.toHaveBeenCalled();
  });

  it("starts a game on a tap anywhere, inside the tap so audio may begin", () => {
    const start = vi.fn();
    const onStart = vi.fn();
    render(<Cabinet actions={{ phase: "attract", start } as Actions} onStart={onStart} />);
    stroke(placePad(), [[20, 470]]);
    expect(onStart).toHaveBeenCalledOnce();
    expect(start).toHaveBeenCalledOnce();
  });

  it("resumes on a tap anywhere", () => {
    const resume = vi.fn();
    render(<Cabinet actions={{ phase: "paused", resume } as Actions} />);
    stroke(screen.getByTestId("board"), [[100, 100]]);
    expect(resume).toHaveBeenCalledOnce();
  });

  it("swallows the click a tap leaves behind, and only that one", () => {
    const onBoardClick = vi.fn();
    render(<Cabinet actions={playing()} onBoardClick={onBoardClick} />);
    const board = screen.getByTestId("board");
    stroke(board, [[100, 100]]);
    fireEvent.click(board);
    expect(onBoardClick).not.toHaveBeenCalled();
    fireEvent.click(board);
    expect(onBoardClick).toHaveBeenCalledOnce();
  });

  it("leaves a mouse to the screen's own handlers", () => {
    const actions = playing();
    render(<Cabinet actions={actions} />);
    const board = screen.getByTestId("board");
    fireEvent.pointerDown(board, { ...finger(100, 100), pointerType: "mouse" });
    fireEvent.pointerMove(board, { ...finger(160, 100), pointerType: "mouse" });
    expect(actions.hold).not.toHaveBeenCalled();
  });
});
