import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { COPIED_MS, CopyButton } from "./CopyButton";

function withClipboard(writeText: (text: string) => Promise<void>) {
  vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
}

describe("CopyButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("puts the value on the clipboard and says so", async () => {
    const writeText = vi.fn(async () => {});
    withClipboard(writeText);
    render(<CopyButton value="the whole note" label="Copy email contents" />);

    await userEvent.click(screen.getByRole("button", { name: /copy email contents/i }));
    expect(writeText).toHaveBeenCalledWith("the whole note");
    expect(await screen.findByRole("button", { name: /^copied$/i })).toBeInTheDocument();
  });

  it("offers the copy again once the confirmation has been read", async () => {
    withClipboard(async () => {});
    render(<CopyButton value="x" label="Copy email contents" />);

    await userEvent.click(screen.getByRole("button", { name: /copy email contents/i }));
    await screen.findByRole("button", { name: /^copied$/i });
    await waitFor(
      () =>
        expect(screen.getByRole("button", { name: /copy email contents/i })).toBeInTheDocument(),
      { timeout: COPIED_MS + 1000 },
    );
  });

  it("lays out both labels at once, so the width cannot change", () => {
    withClipboard(async () => {});
    const { container } = render(<CopyButton value="x" label="Copy email contents" />);
    expect(container).toHaveTextContent("Copy email contents");
    expect(container).toHaveTextContent("Copied");
  });
});
