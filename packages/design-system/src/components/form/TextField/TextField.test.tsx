import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TextField } from "./TextField";

describe("TextField", () => {
  it("names the control with the visible label", () => {
    render(<TextField label="Email address" />);
    expect(screen.getByRole("textbox", { name: "Email address" })).toBeInTheDocument();
  });

  it("clicking the label focuses the control", async () => {
    render(<TextField label="Email address" />);
    await userEvent.click(screen.getByText("Email address"));
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("describes the control with its hint", () => {
    render(<TextField label="Email" description="Only so I can reply." />);
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription("Only so I can reply.");
  });

  it("is neither invalid nor describing an error by default", () => {
    render(<TextField label="Email" />);
    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("");
  });

  it("marks the control invalid and describes it with the caller's error", () => {
    render(<TextField label="Email" error="That address has no @ in it." />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("That address has no @ in it.");
  });

  // `field.module.css` paints the invalid border and the disabled fill off these
  // two attributes, and a wrong name there fails silently. Pin them.
  it("carries the data attributes the stylesheet keys off", () => {
    const { rerender } = render(<TextField label="Email" error="Bad." />);
    expect(screen.getByRole("textbox")).toHaveAttribute("data-invalid");
    rerender(<TextField label="Email" disabled />);
    expect(screen.getByRole("textbox")).toHaveAttribute("data-disabled");
  });

  it("shows the error as text, so the state does not rest on colour alone", () => {
    render(<TextField label="Email" error="That address has no @ in it." />);
    expect(screen.getByText("That address has no @ in it.")).toBeInTheDocument();
  });

  it("says 'optional' in words rather than marking the required fields", () => {
    render(<TextField label="Email" optional />);
    expect(screen.getByRole("textbox", { name: /optional/i })).toBeInTheDocument();
  });

  it("reports typing through onValueChange", async () => {
    const onValueChange = vi.fn();
    render(<TextField label="Email" onValueChange={onValueChange} />);
    await userEvent.type(screen.getByRole("textbox"), "hi");
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual(["h", "hi"]);
  });

  it("supports a controlled value", () => {
    render(<TextField label="Email" value="held" onValueChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("held");
  });

  it("disables the control from the field, not just the input", () => {
    render(<TextField label="Email" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("carries the submit name", () => {
    render(<TextField label="Email" name="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("name", "email");
  });

  it("defaults to type=text and takes the other allowed types", () => {
    const { rerender } = render(<TextField label="Email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
    rerender(<TextField label="Email" type="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
  });
});
