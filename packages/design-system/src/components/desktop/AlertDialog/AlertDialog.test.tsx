import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertDialog } from "./AlertDialog";

function mount(ui: React.ReactNode) {
  return render(<div style={{ position: "relative" }}>{ui}</div>);
}

describe("AlertDialog", () => {
  it("names the dialog by its title, so a reader is told what this is", () => {
    mount(
      <AlertDialog>
        <AlertDialog.Title>Not sent</AlertDialog.Title>
        <AlertDialog.Body>Something went wrong.</AlertDialog.Body>
      </AlertDialog>,
    );
    expect(screen.getByRole("dialog", { name: "Not sent" })).toBeInTheDocument();
  });

  it("places each slot by its type, whatever order they are given in", () => {
    mount(
      <AlertDialog>
        <AlertDialog.Actions>
          <button type="button">OK</button>
        </AlertDialog.Actions>
        <AlertDialog.Body>The body.</AlertDialog.Body>
        <AlertDialog.Title>The title</AlertDialog.Title>
      </AlertDialog>,
    );
    expect(screen.getByRole("dialog", { name: "The title" })).toBeInTheDocument();
    expect(screen.getByText("The body.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
  });

  it("takes focus on open, since what was focused before is now behind it", () => {
    mount(
      <AlertDialog>
        <AlertDialog.Title>Not sent</AlertDialog.Title>
      </AlertDialog>,
    );
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("hides the icon from assistive tech", () => {
    mount(
      <AlertDialog>
        <AlertDialog.Title>Not sent</AlertDialog.Title>
        <AlertDialog.Icon>
          <svg data-testid="mark" />
        </AlertDialog.Icon>
      </AlertDialog>,
    );
    expect(screen.getByTestId("mark").closest("[aria-hidden]")).not.toBeNull();
  });

  it("draws no actions row when there is nothing to do", () => {
    mount(
      <AlertDialog>
        <AlertDialog.Title>For your information</AlertDialog.Title>
        <AlertDialog.Body>Nothing to press.</AlertDialog.Body>
      </AlertDialog>,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
});
