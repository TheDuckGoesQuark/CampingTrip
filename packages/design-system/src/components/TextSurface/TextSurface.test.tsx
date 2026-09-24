import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TextSurface } from "./TextSurface";

describe("TextSurface", () => {
  it("renders a textarea named by its aria-label", () => {
    render(<TextSurface aria-label="Message" />);
    expect(screen.getByRole("textbox", { name: "Message" }).tagName).toBe("TEXTAREA");
  });

  it("resolves a different class per face and per fill", () => {
    render(
      <>
        <TextSurface aria-label="a" face="text" fill="frame" />
        <TextSurface aria-label="b" face="mono" fill="frame" />
        <TextSurface aria-label="c" face="text" fill="content" />
      </>,
    );
    const classes = ["a", "b", "c"].map((name) => screen.getByRole("textbox", { name }).className);
    expect(new Set(classes).size).toBe(3);
  });

  it("is controlled by the caller, like any textarea", async () => {
    const onChange = vi.fn();
    render(<TextSurface aria-label="Message" value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Message" }), "hi");
    expect(onChange).toHaveBeenCalled();
  });

  it("forwards the attributes a compose body needs", () => {
    render(
      <TextSurface
        aria-label="Message"
        placeholder="Anything at all."
        maxLength={10}
        aria-invalid
        aria-describedby="err"
      />,
    );
    const box = screen.getByRole("textbox", { name: "Message" });
    expect(box).toHaveAttribute("placeholder", "Anything at all.");
    expect(box).toHaveAttribute("maxlength", "10");
    expect(box).toHaveAttribute("aria-describedby", "err");
  });
});
