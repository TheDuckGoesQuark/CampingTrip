import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TransferProgress } from "../TransferProgress";
import { LoadingDialog } from "./LoadingDialog";

describe("LoadingDialog", () => {
  it("names the dialog by its title", () => {
    render(
      <LoadingDialog title="Sending">
        <TransferProgress caption="Transferring… 1 of 1 message" />
      </LoadingDialog>,
    );
    expect(screen.getByRole("dialog", { name: "Sending" })).toBeInTheDocument();
  });

  // The contract that separates this from AlertDialog.
  it("offers nothing to press", () => {
    render(
      <LoadingDialog title="Sending">
        <TransferProgress caption="Transferring… 1 of 1 message" />
      </LoadingDialog>,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("puts the caption in the live region and hides the diagram from it", () => {
    render(
      <LoadingDialog title="Sending">
        <TransferProgress caption="Transferring… 1 of 1 message" from="This PC" to="Internet" />
      </LoadingDialog>,
    );
    const live = screen.getByRole("status");
    expect(live).toHaveTextContent("Transferring… 1 of 1 message");
    expect(screen.getByText("This PC").closest("[aria-hidden]")).not.toBeNull();
    expect(screen.getByText("Transferring… 1 of 1 message").closest("[aria-hidden]")).toBeNull();
  });
});
