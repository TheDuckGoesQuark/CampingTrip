import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DPad from "./DPad";

describe("DPad", () => {
  it("lights the arm of the turn being held, and only that one", () => {
    const { container } = render(<DPad queued="right" />);
    const lit = container.querySelectorAll("[class*=lit]");
    expect(lit).toHaveLength(1);
    expect(lit[0].className).toMatch(/right/);
  });

  it("stays out of the accessibility tree, since the area round it takes the touches", () => {
    const { container } = render(<DPad queued={null} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
