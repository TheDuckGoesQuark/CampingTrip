import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TextArea } from "./TextArea";

describe("TextArea", () => {
  it("renders a textarea, not an input", () => {
    render(<TextArea label="Message" />);
    expect(screen.getByRole("textbox", { name: "Message" }).tagName).toBe("TEXTAREA");
  });

  it("keeps the textarea's own semantics through the render substitution", () => {
    render(<TextArea label="Message" />);
    // Base UI stamps `role="button"` on a substituted Button; a labelable form
    // control has nothing for it to overwrite, so no role is added here.
    expect(screen.getByRole("textbox")).not.toHaveAttribute("role");
  });

  it("clicking the label focuses the control", async () => {
    render(<TextArea label="Message" />);
    await userEvent.click(screen.getByText("Message"));
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("marks the control invalid and describes it with the caller's error", () => {
    render(<TextArea label="Message" error="Say something first." />);
    const box = screen.getByRole("textbox");
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(box).toHaveAccessibleDescription("Say something first.");
  });

  it("carries the data attributes the stylesheet keys off", () => {
    const { rerender } = render(<TextArea label="Message" error="Bad." />);
    expect(screen.getByRole("textbox")).toHaveAttribute("data-invalid");
    rerender(<TextArea label="Message" disabled />);
    expect(screen.getByRole("textbox")).toHaveAttribute("data-disabled");
  });

  it("describes the control with its hint", () => {
    render(<TextArea label="Message" description="Anything at all." />);
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription("Anything at all.");
  });

  it("opens at four rows and takes an override", () => {
    const { rerender } = render(<TextArea label="Message" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "4");
    rerender(<TextArea label="Message" rows={8} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "8");
  });

  it("reports typing through onValueChange", async () => {
    const onValueChange = vi.fn();
    render(<TextArea label="Message" onValueChange={onValueChange} />);
    await userEvent.type(screen.getByRole("textbox"), "yo");
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual(["y", "yo"]);
  });

  it("disables the control from the field", () => {
    render(<TextArea label="Message" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
