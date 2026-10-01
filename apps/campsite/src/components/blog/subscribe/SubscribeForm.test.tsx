import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RenderTargetContext, type RenderTarget } from "../../../prerender/renderTarget";
import { blogPaths } from "../../../routing/blogPaths";
import { SUBSCRIBE_ENDPOINT } from "./submitSubscription";
import SubscribeForm, {
  CONSENT,
  EMAIL_LABEL,
  SENT,
  SUBMIT_LABEL,
  SUBSCRIBE_HEADING,
} from "./SubscribeForm";

function mount(target: RenderTarget, ui: ReactNode = <SubscribeForm />) {
  return render(
    <RenderTargetContext.Provider value={target}>
      <MemoryRouter>{ui}</MemoryRouter>
    </RenderTargetContext.Provider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("SubscribeForm", () => {
  it("is a plain POST to the endpoint when rendered statically", () => {
    mount("static");
    const form = screen.getByRole("textbox", { name: EMAIL_LABEL }).closest("form")!;
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", SUBSCRIBE_ENDPOINT);
    expect(screen.getByRole("button", { name: SUBMIT_LABEL })).toHaveAttribute("type", "submit");
  });

  it("names the field, asks for an email, and hides the honeypot from readers", () => {
    const { container } = mount("static");
    const email = screen.getByRole("textbox", { name: EMAIL_LABEL });
    expect(email).toHaveAttribute("type", "email");
    expect(email).toBeRequired();
    const trap = container.querySelector('input[name="trap"]')!;
    expect(trap).toHaveAttribute("aria-hidden");
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap).toHaveValue("");
  });

  it("says what happens next and where the address goes", () => {
    mount("static");
    expect(screen.getByRole("heading", { name: SUBSCRIBE_HEADING })).toBeInTheDocument();
    expect(screen.getByText(CONSENT, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /how i secure your email/i })).toHaveAttribute(
      "href",
      blogPaths.privacy,
    );
  });

  it("takes the heading level the page needs", () => {
    mount("static", <SubscribeForm headingLevel="h1" />);
    expect(screen.getByRole("heading", { level: 1, name: SUBSCRIBE_HEADING })).toBeInTheDocument();
  });

  it("posts JSON in place when live, then shows the confirmation copy", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    mount("live");
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: EMAIL_LABEL }), "reader@example.com");
    await user.click(screen.getByRole("button", { name: SUBMIT_LABEL }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(SUBSCRIBE_ENDPOINT);
    expect(JSON.parse(init.body)).toEqual({ email: "reader@example.com", trap: "" });
    expect(await screen.findByRole("status")).toHaveTextContent(SENT);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("tells a reader the day's sign-ups are used up on a 503, and keeps the form", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    mount("live");
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: EMAIL_LABEL }), "reader@example.com");
    await user.click(screen.getByRole("button", { name: SUBMIT_LABEL }));

    expect(await screen.findByText(/too many sign ups today/)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: EMAIL_LABEL })).toBeInvalid();
  });
});
