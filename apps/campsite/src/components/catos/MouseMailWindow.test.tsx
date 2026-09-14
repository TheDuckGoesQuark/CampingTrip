import { BrandProvider } from "@jordanscamp/ds";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mailPreset, type PresetId } from "../../data/mailPresets";
import { COPIED_MS } from "../blog/contact/SendDialog";
import { MESSAGE_LIMIT, MIN_DWELL_MS } from "../blog/contact/submitFeedback";
import { SEND_FLOOR_MS } from "../blog/contact/useCompose";
import MouseMailWindow from "./MouseMailWindow";

const LABEL = "someone@example.com";

/* Sending outlasts Testing Library's default wait. Derived, not picked, so
   retuning the floor cannot fail these. */
const SETTLED = { timeout: SEND_FLOOR_MS + 2000 };

function mount(preset: PresetId | null = null, onClose: () => void = () => {}) {
  return render(
    <BrandProvider>
      <MouseMailWindow emailLabel={LABEL} preset={preset} onClose={onClose} />
    </BrandProvider>,
  );
}

function refuseWith(status: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status })),
  );
}

// Shifted, not frozen: the send floor and `waitFor` both measure elapsed time,
// so a `Date.now` that never moves is one that never settles.
function pastTheDwellFloor() {
  const real = Date.now.bind(Date);
  vi.spyOn(Date, "now").mockImplementation(() => real() + MIN_DWELL_MS + 1);
}

const dialog = () => screen.getByRole("dialog");

/** The dialog is up from the moment Send is pressed, so settle on the outcome. */
const settledOnFailure = () => screen.findByRole("button", { name: /^back$/i }, SETTLED);
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
    vi.restoreAllMocks();
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
    expect(
      await screen.findByText(/thanks for your message/i, undefined, SETTLED),
    ).toBeInTheDocument();
    expect(dialog()).toHaveTextContent(/thanks for your message/i);
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
    await screen.findByText(/thanks for your message/i, undefined, SETTLED);
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
    await screen.findByText(/thanks for your message/i, undefined, SETTLED);
  });

  it("closes MouseMail when the confirmation is dismissed", async () => {
    const onClose = vi.fn();
    mount(null, onClose);
    await userEvent.type(messageBox(), "smiled");
    await userEvent.click(sendButton());
    await screen.findByText(/thanks for your message/i, undefined, SETTLED);
    await userEvent.click(screen.getByRole("button", { name: /^ok$/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("promises a reply when an address was left", async () => {
    mount();
    await userEvent.type(messageBox(), "smiled");
    await userEvent.type(fromBox(), "a@b.com");
    await userEvent.click(sendButton());
    expect(await screen.findByText(/I'll usually reply/i, undefined, SETTLED)).toBeInTheDocument();
  });

  it("promises only to read it when no address was left", async () => {
    mount();
    await userEvent.type(messageBox(), "smiled");
    await userEvent.click(sendButton());
    expect(await screen.findByText(/I should see it/i, undefined, SETTLED)).toBeInTheDocument();
    expect(screen.queryByText(/usually reply/i)).toBeNull();
  });

  it("hands the note back untouched when the send fails", async () => {
    refuseWith(400);
    const { container } = mount();
    await userEvent.type(messageBox(), "the lantern flickers");
    await userEvent.click(sendButton());
    await settledOnFailure();
    expect(screen.getByText("Couldn't send")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(draft(container)).toBeNull();
    expect(messageBox()).toHaveValue("the lantern flickers");
  });

  describe("why it failed", () => {
    async function attempt(status: number, prepare?: () => void) {
      refuseWith(status);
      mount();
      await userEvent.type(subjectBox(), "Found a bug");
      await userEvent.type(messageBox(), "the lantern flickers");
      prepare?.();
      await userEvent.click(sendButton());
      await settledOnFailure();
      return dialog();
    }

    it("blames the load rather than the sender on a 429", async () => {
      const panel = await attempt(429);
      expect(panel).toHaveTextContent(/too much at once/i);
      expect(panel).not.toHaveTextContent(/you have sent|too many messages/i);
    });

    it("names the dwell floor when the send beat it", async () => {
      const panel = await attempt(400);
      expect(panel).toHaveTextContent(/couple of seconds/i);
    });

    it("says only that it was turned away once the dwell floor is clear", async () => {
      const panel = await attempt(400, pastTheDwellFloor);
      expect(panel).toHaveTextContent(/turned it away/i);
      expect(panel).not.toHaveTextContent(/couple of seconds/i);
    });

    it("owns a 5xx", async () => {
      expect(await attempt(503)).toHaveTextContent(/broke at my end/i);
    });

    it("points at the connection when nothing answers", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new Error("no network");
        }),
      );
      mount();
      await userEvent.type(messageBox(), "smiled");
      await userEvent.click(sendButton());
      await settledOnFailure();
      expect(dialog()).toHaveTextContent(/your connection/i);
    });
  });

  describe("the hand-over", () => {
    it("copies the address, subject and note as one block", async () => {
      const writeText = vi.fn(async () => {});
      vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
      refuseWith(400);
      mount();
      await userEvent.type(subjectBox(), "Found a bug");
      await userEvent.type(messageBox(), "the lantern flickers");
      await userEvent.click(sendButton());
      await settledOnFailure();

      await userEvent.click(screen.getByRole("button", { name: /copy email contents/i }));
      expect(writeText).toHaveBeenCalledWith(
        `To: ${LABEL}\nSubject: Found a bug\n\nthe lantern flickers\n`,
      );
      expect(await screen.findByRole("button", { name: /^copied$/i })).toBeInTheDocument();
      await waitFor(
        () =>
          expect(screen.getByRole("button", { name: /copy email contents/i })).toBeInTheDocument(),
        { timeout: COPIED_MS + 1000 },
      );
    });

    it("shows the text to copy by hand when the clipboard refuses", async () => {
      vi.stubGlobal("navigator", {
        ...navigator,
        clipboard: {
          writeText: async () => {
            throw new Error("denied");
          },
        },
      });
      refuseWith(400);
      mount();
      await userEvent.type(messageBox(), "the lantern flickers");
      await userEvent.click(sendButton());
      await settledOnFailure();

      await userEvent.click(screen.getByRole("button", { name: /copy email contents/i }));
      const block = await screen.findByRole("textbox", { name: /to copy/i });
      expect(block).toHaveValue(`To: ${LABEL}\n\nthe lantern flickers\n`);
      expect(screen.queryByRole("button", { name: /^copied$/i })).toBeNull();
    });
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
