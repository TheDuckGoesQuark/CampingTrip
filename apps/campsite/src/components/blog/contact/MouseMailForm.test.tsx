import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MouseMailForm from "./MouseMailForm";
import type { Feedback } from "./submitFeedback";

const MAILTO = "mailto:someone@example.com";
const LABEL = "someone@example.com";

function mount(onPhaseChange?: (p: string) => void) {
  return render(<MouseMailForm mailto={MAILTO} emailLabel={LABEL} onPhaseChange={onPhaseChange} />);
}

const messageBox = () => screen.getByRole("textbox", { name: /what's on your mind/i });
const emailBox = () => screen.getByRole("textbox", { name: /your email/i });
const sendButton = () => screen.getByRole("button", { name: "Send" });

/** The body the endpoint would have received. */
function sentBody(): Feedback {
  const [, init] = vi.mocked(fetch).mock.calls[0];
  return JSON.parse(init?.body as string);
}

describe("MouseMailForm", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("refuses an empty note without troubling the endpoint", async () => {
    mount();
    await userEvent.click(sendButton());
    expect(messageBox()).toHaveAccessibleDescription(/add a note first/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("clears that error once something is typed and sends", async () => {
    mount();
    await userEvent.click(sendButton());
    await userEvent.type(messageBox(), "the cat is great");
    await userEvent.click(sendButton());
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(sentBody().message).toBe("the cat is great");
  });

  it("posts to the same-origin path, so there is no preflight", async () => {
    mount();
    await userEvent.type(messageBox(), "hello");
    await userEvent.click(sendButton());
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/contact");
  });

  it("omits the email key entirely when none is given", async () => {
    mount();
    await userEvent.type(messageBox(), "no reply needed");
    await userEvent.click(sendButton());
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect("email" in sentBody()).toBe(false);
  });

  it("carries the email when one is given, trimmed", async () => {
    mount();
    await userEvent.type(messageBox(), "  do reply  ");
    await userEvent.type(emailBox(), "  a@b.com  ");
    await userEvent.click(sendButton());
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const body = sentBody();
    expect(body.email).toBe("a@b.com");
    expect(body.message).toBe("do reply");
  });

  it("sends the empty honeypot and a mount time for the dwell check", async () => {
    const before = Date.now();
    mount();
    await userEvent.type(messageBox(), "hi");
    await userEvent.click(sendButton());
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const body = sentBody();
    expect(body.trap).toBe("");
    expect(body.mountedAt).toBeGreaterThanOrEqual(before);
    expect(body.mountedAt).toBeLessThanOrEqual(Date.now());
  });

  it("hides the honeypot from assistive tech as well as from the eye", () => {
    const { container } = mount();
    const trap = container.querySelector('input[name="trap"]');
    expect(trap).not.toBeNull();
    expect(trap).toHaveAttribute("aria-hidden", "true");
    expect(trap).toHaveAttribute("tabindex", "-1");
    // Not reachable by its role, which is what a screen reader walks.
    expect(screen.queryAllByRole("textbox")).toHaveLength(2);
  });

  it("thanks the sender on success", async () => {
    mount();
    await userEvent.type(messageBox(), "smiled");
    await userEvent.click(sendButton());
    expect(await screen.findByText(/thank you/i)).toBeInTheDocument();
  });

  it("offers the address when the endpoint refuses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 400 })),
    );
    mount();
    await userEvent.type(messageBox(), "smiled");
    await userEvent.click(sendButton());
    expect(await screen.findByRole("link", { name: LABEL })).toHaveAttribute("href", MAILTO);
  });

  it("offers the address when the network never answers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    mount();
    await userEvent.type(messageBox(), "smiled");
    await userEvent.click(sendButton());
    expect(await screen.findByRole("link", { name: LABEL })).toHaveAttribute("href", MAILTO);
  });

  // The window's status bar is driven by this, so it is part of the contract.
  it("reports each phase it passes through", async () => {
    const phases: string[] = [];
    mount((p) => phases.push(p));
    await userEvent.type(messageBox(), "smiled");
    await userEvent.click(sendButton());
    await waitFor(() => expect(phases).toContain("sent"));
    expect(phases).toEqual(["sending", "sent"]);
  });
});
