import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import UselessMachine from "./UselessMachine";

/** jsdom runs no animations, so the phase clock is ours to turn by hand. */
function lid() {
  return screen.getByTestId("machine-lid");
}

function paw() {
  return screen.getByTestId("machine-paw");
}

function machine() {
  return screen.getByTestId("machine-lid").closest("[data-phase]")!;
}

function switchOn() {
  fireEvent.click(screen.getByRole("button", { name: "Do not press" }));
}

function runTheCycle() {
  fireEvent.animationEnd(lid());
  fireEvent.animationEnd(paw());
  fireEvent.animationEnd(paw());
}

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
    fireEvent.animationEnd(lid());
    expect(machine()).toHaveAttribute("data-phase", "reaching");
    expect(screen.getByText("ON")).toBeInTheDocument();
  });

  it("goes out when the paw arrives, and announces it", () => {
    render(<UselessMachine />);
    switchOn();
    fireEvent.animationEnd(lid());
    fireEvent.animationEnd(paw());
    expect(screen.getByText("OFF")).toBeInTheDocument();
    expect(screen.getByText("The cat switched it off.")).toBeInTheDocument();
  });

  it("returns to rest once the paw is back in the box", () => {
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
    fireEvent.animationEnd(lid());
    switchOn();
    switchOn();

    expect(machine()).toHaveAttribute("data-phase", "reaching");
    expect(machine()).toHaveAttribute("data-mood", "annoyed");
  });

  it("ignores an animation that ends after its phase has moved on", () => {
    render(<UselessMachine />);
    fireEvent.animationEnd(paw());
    fireEvent.animationEnd(lid());
    expect(machine()).toHaveAttribute("data-phase", "idle");
  });

  it("points the pupils at the pointer while it is resting", () => {
    render(<UselessMachine />);
    fireEvent.pointerMove(window, { clientX: 200, clientY: 0 });
    expect(machine()).toHaveStyle({ "--gaze-x": "0.47619047619047616" });
  });

  it("stops watching the pointer once someone presses it", () => {
    render(<UselessMachine />);
    switchOn();
    fireEvent.pointerMove(window, { clientX: 200, clientY: 0 });
    expect(machine()).not.toHaveStyle({ "--gaze-x": "0.47619047619047616" });
  });
});
