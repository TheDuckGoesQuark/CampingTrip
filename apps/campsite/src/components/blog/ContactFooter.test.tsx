import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { contactLabel, contactMailto } from "../../data/contactEmail";
import { cv } from "../../data/cv";
import { RenderTargetContext, type RenderTarget } from "../../prerender/renderTarget";
import { WINDOW_MAIL } from "../../routing/windows";
import { useSceneStore } from "../../store/sceneStore";
import { watchIntersections } from "../../test/intersection";
import ContactFooter, { CONTACT_HEADING, CONTACT_ID } from "./ContactFooter";

import styles from "./blog.module.css";

vi.mock("../../audio/soundEffects", () => ({ playWindowOpen: vi.fn() }));

let observers: ReturnType<typeof watchIntersections>;

/** Long enough to clear whatever wait the component settled on. */
const PAST_THE_WAIT = 5000;

const wait = () =>
  act(() => {
    vi.advanceTimersByTime(PAST_THE_WAIT);
  });

/**
 * Found through the heading, not by landmark: alone this footer *is*
 * `contentinfo`, which is precisely what it is not inside a page's `main`.
 */
function shimmer() {
  const found = screen.getByRole("heading", { name: CONTACT_HEADING }).closest("footer");
  // `composes` makes the export a list of class names, not one.
  return found!.querySelector(`.${styles.contactShimmer.trim().split(/\s+/).join(".")}`);
}

function invitation() {
  return screen.getByRole("link", { name: "let me know" });
}

const MAILTO = contactMailto as string;
const EMAIL_LABEL = contactLabel as string;

function at(target: RenderTarget, node: ReactNode) {
  return render(<RenderTargetContext.Provider value={target}>{node}</RenderTargetContext.Provider>);
}

/** The trigger the footer's own invitation offers. */
const here = () => screen.getByRole("link", { name: "here" });
const openWindows = () => useSceneStore.getState().openWindows;

describe("ContactFooter", () => {
  describe("the arrival shimmer", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      observers = watchIntersections();
    });

    afterEach(() => {
      vi.useRealTimers();
      observers.restore();
    });

    it("does not shimmer at anyone who has not reached it", () => {
      render(<ContactFooter />);
      wait();
      expect(shimmer()).toBeNull();
    });

    it("shimmers once the visitor has settled on it", () => {
      render(<ContactFooter />);
      observers.send(true);
      wait();
      expect(shimmer()).not.toBeNull();
    });

    it("shimmers again each time the invitation is followed", () => {
      render(
        <>
          <a href={`#${CONTACT_ID}`}>let me know</a>
          <ContactFooter />
        </>,
      );
      observers.send(true);
      wait();
      const first = shimmer();

      act(() => invitation().click());
      wait();
      const second = shimmer();

      expect(second).not.toBeNull();
      expect(second).not.toBe(first);
    });
  });

  // Real timers here: `userEvent` schedules its own, and the fake ones above
  // would leave every click awaiting a tick that never comes.
  describe("the invitation to say something", () => {
    beforeEach(() => {
      observers = watchIntersections();
      useSceneStore.getState().closeAllWindows();
    });

    afterEach(() => {
      observers.restore();
      useSceneStore.getState().closeAllWindows();
    });

    it("sits beside the links", () => {
      at("live", <ContactFooter />);
      expect(screen.getByText(/let me know/i)).toBeInTheDocument();
    });

    describe("prerendered, with no script running", () => {
      it("leaves the invitation as a real mailto link", () => {
        at("static", <ContactFooter />);
        expect(here()).toHaveAttribute("href", MAILTO);
      });

      it("leaves the email link alone", () => {
        at("static", <ContactFooter />);
        expect(screen.getByRole("link", { name: EMAIL_LABEL })).toHaveAttribute("href", MAILTO);
      });

      it("opens no window, because there is no desktop to open one on", async () => {
        at("static", <ContactFooter />);
        await userEvent.click(here());
        expect(openWindows()).toEqual([]);
      });
    });

    describe("live", () => {
      it("keeps the mailto href, so a copied link still reaches me", () => {
        at("live", <ContactFooter />);
        expect(here()).toHaveAttribute("href", MAILTO);
      });

      it("opens MouseMail instead of the mail client", async () => {
        at("live", <ContactFooter />);
        await userEvent.click(here());
        expect(openWindows()).toContain(WINDOW_MAIL);
      });

      it("opens the same window from the email address", async () => {
        at("live", <ContactFooter />);
        await userEvent.click(screen.getByRole("link", { name: EMAIL_LABEL }));
        expect(openWindows()).toContain(WINDOW_MAIL);
      });

      // `raiseWindow` is idempotent, so a second click raises rather than stacks.
      it("never opens a second copy", async () => {
        at("live", <ContactFooter />);
        await userEvent.click(here());
        await userEvent.click(screen.getByRole("link", { name: EMAIL_LABEL }));
        expect(openWindows().filter((id) => id === WINDOW_MAIL)).toHaveLength(1);
      });

      it("leaves the other profile links as plain links", async () => {
        at("live", <ContactFooter />);
        const github = cv.links.find((link) => link.url.includes("github.com"));
        await userEvent.click(screen.getByRole("link", { name: github?.label as string }));
        expect(openWindows()).toEqual([]);
      });

      // A reader holding a modifier wants a new tab or the address on the
      // clipboard; taking the click would steal a browser affordance.
      it("stays out of the way of a modified click", async () => {
        // One `setup()` instance, not the direct API: each direct call builds
        // its own instance, so a modifier held by one is forgotten by the next.
        const user = userEvent.setup();
        at("live", <ContactFooter />);
        await user.keyboard("[ControlLeft>]");
        await user.click(here());
        await user.keyboard("[/ControlLeft]");
        expect(openWindows()).toEqual([]);
      });
    });
  });
});
