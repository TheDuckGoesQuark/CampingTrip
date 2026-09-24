import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import UselessMachine from "./UselessMachine";

/** jsdom runs no animations, so the phase clock is ours to turn by hand. */
function box() {
  return screen.getByTestId("machine-box");
}

function paw() {
  return screen.getByTestId("machine-paw");
}

function machine() {
  return screen.getByTestId("machine-box").closest("[data-phase]")!;
}

function switchOn() {
  fireEvent.click(screen.getByRole("button", { name: "Do not press" }));
}

function runTheCycle() {
  fireEvent.animationEnd(box());
  fireEvent.animationEnd(paw());
  fireEvent.animationEnd(paw());
}

/** The quiet between looks is random, so a test that waits a fixed time has to
 *  pin it or it asserts against a coin toss. Zero gives the shortest gap. */
function waitForALook() {
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockReturnValue(0);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("UselessMachine", () => {
  it("starts off, and says so in text as well as colour", () => {
    render(<UselessMachine />);
    expect(screen.getByText("OFF")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Do not press" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("lights up when pressed", () => {
    render(<UselessMachine />);
    switchOn();
    expect(screen.getByText("ON")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Do not press" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("stays lit while the paw is on its way", () => {
    render(<UselessMachine />);
    switchOn();
    fireEvent.animationEnd(box());
    expect(machine()).toHaveAttribute("data-phase", "reaching");
    expect(screen.getByText("ON")).toBeInTheDocument();
  });

  it("goes out when the paw arrives, and announces it", () => {
    render(<UselessMachine />);
    switchOn();
    fireEvent.animationEnd(box());
    fireEvent.animationEnd(paw());
    expect(screen.getByText("OFF")).toBeInTheDocument();
    expect(screen.getByText("The cat switched it off.")).toBeInTheDocument();
  });

  it("returns to rest once the paw is back under the card", () => {
    render(<UselessMachine />);
    switchOn();
    runTheCycle();
    expect(machine()).toHaveAttribute("data-phase", "idle");
    expect(screen.queryByText("The cat switched it off.")).not.toBeInTheDocument();
  });

  it("gets annoyed on the third press and feral on the fifth", () => {
    render(<UselessMachine />);
    expect(machine()).toHaveAttribute("data-mood", "calm");

    switchOn();
    runTheCycle();
    switchOn();
    runTheCycle();
    switchOn();
    expect(machine()).toHaveAttribute("data-mood", "annoyed");

    runTheCycle();
    switchOn();
    runTheCycle();
    switchOn();
    expect(machine()).toHaveAttribute("data-mood", "feral");
  });

  it("takes a press mid-reach as provocation without restarting the arc", () => {
    render(<UselessMachine />);
    switchOn();
    fireEvent.animationEnd(box());
    switchOn();
    switchOn();

    expect(machine()).toHaveAttribute("data-phase", "reaching");
    expect(machine()).toHaveAttribute("data-mood", "annoyed");
  });

  it("ignores an animation that ends after its phase has moved on", () => {
    render(<UselessMachine />);
    fireEvent.animationEnd(paw());
    fireEvent.animationEnd(box());
    expect(machine()).toHaveAttribute("data-phase", "idle");
  });

  it("keeps the eyes in until the visitor has seen the cat once", () => {
    waitForALook();
    render(<UselessMachine />);
    act(() => vi.advanceTimersByTime(60_000));
    expect(machine()).toHaveAttribute("data-peeking", "false");
  });

  it("looks out, then puts its head back in, once a full cycle has run", () => {
    waitForALook();
    render(<UselessMachine />);
    switchOn();
    runTheCycle();
    act(() => vi.advanceTimersByTime(4000));
    expect(machine()).toHaveAttribute("data-peeking", "true");

    act(() => vi.advanceTimersByTime(2600));
    expect(machine()).toHaveAttribute("data-peeking", "false");
  });

  it("stops looking out the moment the switch is pressed again", () => {
    waitForALook();
    render(<UselessMachine />);
    switchOn();
    runTheCycle();
    act(() => vi.advanceTimersByTime(4000));
    expect(machine()).toHaveAttribute("data-peeking", "true");

    act(() => switchOn());
    expect(machine()).toHaveAttribute("data-peeking", "false");
  });

  it("points the pupils at the pointer only while it is looking out", () => {
    waitForALook();
    render(<UselessMachine />);
    fireEvent.pointerMove(window, { clientX: 200, clientY: 0 });
    expect(machine()).not.toHaveStyle({ "--gaze-x": "0.47619047619047616" });

    switchOn();
    runTheCycle();
    act(() => vi.advanceTimersByTime(4000));
    fireEvent.pointerMove(window, { clientX: 200, clientY: 0 });
    expect(machine()).toHaveStyle({ "--gaze-x": "0.47619047619047616" });
  });
});
