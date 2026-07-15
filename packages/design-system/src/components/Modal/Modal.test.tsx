import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "./Modal";

function Fixture({ onOpenChange }: { onOpenChange?: (o: boolean) => void }) {
  return (
    <Modal ariaLabel="Test dialog" onOpenChange={onOpenChange}>
      <Modal.Trigger>Open</Modal.Trigger>
      <Modal.Header>
        <Modal.Title>Title</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <button type="button">Inside</button>
      </Modal.Body>
    </Modal>
  );
}

describe("Modal", () => {
  it("is closed until the trigger is activated", () => {
    render(<Fixture />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens from the trigger and moves focus into the dialog", async () => {
    render(<Fixture />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it("closes on Escape, returns focus to the trigger, and reports via onOpenChange", async () => {
    const onOpenChange = vi.fn();
    render(<Fixture onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    await screen.findByRole("dialog");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    // Base UI calls onOpenChange(open, eventDetails, reason) — assert the close.
    expect(onOpenChange.mock.calls.some((call) => call[0] === false)).toBe(true);
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("supports controlled open state", () => {
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <Modal ariaLabel="Controlled" open={open} onOpenChange={setOpen}>
          <Modal.Body>content</Modal.Body>
        </Modal>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
