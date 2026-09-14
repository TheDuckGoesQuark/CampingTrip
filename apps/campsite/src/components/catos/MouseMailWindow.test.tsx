import { BrandProvider } from "@jordanscamp/ds";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mailPreset, type PresetId } from "../../data/mailPresets";
import { MESSAGE_LIMIT } from "../blog/contact/submitFeedback";
import { SEND_FLOOR_MS } from "../blog/contact/useCompose";
import MouseMailWindow from "./MouseMailWindow";

const MAILTO = "mailto:someone@example.com";
const LABEL = "someone@example.com";

/* Sending outlasts Testing Library's default wait. Derived, not picked, so
   retuning the floor cannot fail these. */
const SETTLED = { timeout: SEND_FLOOR_MS + 2000 };

function mount(preset: PresetId | null = null, onClose: () => void = () => {}) {
  return render(
    <BrandProvider>
      <MouseMailWindow mailto={MAILTO} emailLabel={LABEL} preset={preset} onClose={onClose} />
    </BrandProvider>,
  );
}

const dialog = () => screen.getByRole("dialog");
const draft = (container: HTMLElement) => container.querySelector("[inert]");

const subjectBox = () => screen.getByRole("textbox", { name: /subject/i });
const fromBox = () => screen.getByRole("textbox", { name: /from/i });
const messageBox = () => screen.getByRole("textbox", { name: /message/i });
const sendButton = () => screen.getByRole("button", { name: /send/i });
const pill = (label: string) => screen.getByRole("button", { name: new RegExp(label, "i") });

describe("MouseMailWindow", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the address the note goes to, in a field nobody can change", () => {
    mount();
    const to = screen.getByRole("textbox", { name: /^to$/i });
    expect(to).toHaveValue(LABEL);
    expect(to).toHaveAttribute("readonly");
    // Read-only, not switched off: the address is still selectable and still a
    // tab stop, which is the whole difference from `disabled`.
    expect(to).not.toBeDisabled();
  });

  // No label and no border on the writing surface, so its name is the only
  // thing telling a screen reader what the page of the window is for.
  it("names the writing surface without putting a label above it", () => {
    mount();
    expect(messageBox()).toBeInTheDocument();
    expect(screen.queryByText("Message")).toBeNull();
  });

  it("fills the subject and the message in from a template pill", async () => {
    mount();
    await userEvent.click(pill(mailPreset("bug").label));
    expect(subjectBox()).toHaveValue(mailPreset("bug").subject);
    expect(messageBox()).toHaveValue(mailPreset("bug").body);
  });

  it("marks the chosen pill as the one in force", async () => {
    mount();
    await userEvent.click(pill(mailPreset("feedback").label));
    expect(pill(mailPreset("feedback").label)).toHaveAttribute("aria-pressed", "true");
    expect(pill(mailPreset("bug").label)).toHaveAttribute("aria-pressed", "false");
  });

  it("opens already filled in when the visitor arrived by a reason", () => {
    mount("work");
    expect(subjectBox()).toHaveValue(mailPreset("work").subject);
    expect(pill(mailPreset("work").label)).toHaveAttribute("aria-pressed", "true");
  });

  it("sends what was typed, subject and all", async () => {
    mount();
    await userEvent.click(pill(mailPreset("bug").label));
    await userEvent.type(messageBox(), "the lantern flickers");
    await userEvent.type(fromBox(), "a@b.com");
    await userEvent.click(sendButton());
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body.subject).toBe(mailPreset("bug").subject);
    expect(body.email).toBe("a@b.com");
    expect(body.message).toContain("the lantern flickers");
  });

  it("says in the status bar what the window is doing, and how much room is left", async () => {
    mount();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText(`0 / ${MESSAGE_LIMIT}`)).toBeInTheDocument();
    await userEvent.type(messageBox(), "abc");
    expect(screen.getByText(`3 / ${MESSAGE_LIMIT}`)).toBeInTheDocument();
  });

  it("thanks the sender in a dialog over the draft", async () => {
    mount();
    await userEvent.type(messageBox(), "smiled");
    await userEvent.click(sendButton());
    expect(await screen.findByText(/thank you/i, undefined, SETTLED)).toBeInTheDocument();
    expect(dialog()).toHaveTextContent(/thank you/i);
    expect(screen.getByText("Sent")).toBeInTheDocument();
  });

  it("runs a transfer while the note is in flight, and announces it", async () => {
    const { container } = mount();
    await userEvent.type(messageBox(), "smiled");
    await userEvent.click(sendButton());
    expect(await screen.findByRole("status")).toHaveTextContent(/transferring/i);
    expect(dialog()).toBeInTheDocument();
    expect(screen.getByText("Sending…")).toBeInTheDocument();
    // The count belongs to a surface nobody can reach right now.
    expect(screen.queryByText(new RegExp(`/ ${MESSAGE_LIMIT}`))).toBeNull();
    expect(draft(container)).not.toBeNull();
    await screen.findByText(/thank you/i, undefined, SETTLED);
  });

  // The draft is switched off rather than thrown away, which is the whole reason
  // a failed send can hand it back.
  it("keeps what was typed underneath, switched off", async () => {
    const { container } = mount();
    await userEvent.type(messageBox(), "the lantern flickers");
    await userEvent.click(sendButton());
    await screen.findByRole("dialog");
    expect(draft(container)).toContainElement(messageBox());
    expect(messageBox()).toHaveValue("the lantern flickers");
    await screen.findByText(/thank you/i, undefined, SETTLED);
  });

  it("closes MouseMail when the confirmation is dismissed", async () => {
    const onClose = vi.fn();
    mount(null, onClose);
    await userEvent.type(messageBox(), "smiled");
    await userEvent.click(sendButton());
    await screen.findByText(/thank you/i, undefined, SETTLED);
    await userEvent.click(screen.getByRole("button", { name: /^ok$/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("promises a reply to the address that was left, and quotes it back", async () => {
    mount();
    await userEvent.type(messageBox(), "smiled");
    await userEvent.type(fromBox(), "a@b.com");
    await userEvent.click(sendButton());
    await screen.findByText(/thank you/i, undefined, SETTLED);
    expect(screen.getByText("a@b.com")).toBeInTheDocument();
    expect(screen.getByText(/write back to/i)).toBeInTheDocument();
  });

  it("says plainly that nothing comes back when no address was left", async () => {
    mount();
    await userEvent.type(messageBox(), "smiled");
    await userEvent.click(sendButton());
    await screen.findByText(/thank you/i, undefined, SETTLED);
    expect(screen.getByText(/message in a bottle/i)).toBeInTheDocument();
    expect(screen.queryByText(/write back to/i)).toBeNull();
  });

  it("says the send failed, still offers the address, and hands the note back", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 400 })),
    );
    const { container } = mount();
    await userEvent.type(messageBox(), "the lantern flickers");
    await userEvent.click(sendButton());
    expect(await screen.findByText(/failed to send/i, undefined, SETTLED)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: LABEL })).toHaveAttribute("href", MAILTO);
    expect(screen.getByText("Couldn't send")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /back to my note/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(draft(container)).toBeNull();
    expect(messageBox()).toHaveValue("the lantern flickers");
  });

  it("hides the honeypot from assistive tech as well as from the eye", () => {
    const { container } = mount();
    const trap = container.querySelector('input[name="trap"]');
    expect(trap).not.toBeNull();
    expect(trap).toHaveAttribute("aria-hidden", "true");
    expect(trap).toHaveAttribute("tabindex", "-1");
    // Not reachable by its role, which is what a screen reader walks: the four
    // that are reachable are the address it goes to, the reply address, the
    // subject and the message.
    expect(screen.queryAllByRole("textbox")).toHaveLength(4);
  });

  it("refuses an empty note without troubling the endpoint", async () => {
    mount();
    await userEvent.click(sendButton());
    expect(messageBox()).toHaveAccessibleDescription(/add a note first/i);
    expect(fetch).not.toHaveBeenCalled();
  });
});
