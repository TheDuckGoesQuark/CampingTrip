import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BrowserPage } from "../../data/blogPages";
import { contactLabel, contactMailto } from "../../data/contactEmail";
import { cv } from "../../data/cv";
import { MAIL_PRESETS, mailPreset, presetMailto } from "../../data/mailPresets";
import { RenderTargetContext, type RenderTarget } from "../../prerender/renderTarget";
import { blogPaths } from "../../routing/blogPaths";
import { WINDOW_MAIL } from "../../routing/windows";
import { useSceneStore } from "../../store/sceneStore";
import { watchIntersections } from "../../test/intersection";
import ContactFooter, {
  CONTACT_HEADING,
  CONTACT_ID,
  CV_LINK_LABEL,
  RAIL_LABEL,
} from "./ContactFooter";

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

const START = blogPaths.home;

const ELSEWHERE: BrowserPage = { kind: "home" };

const ON_THE_CV: BrowserPage = { kind: "cv", cv };

function PathProbe() {
  return <span data-testid="path">{useLocation().pathname}</span>;
}

function at(target: RenderTarget, node: ReactNode) {
  return render(
    <RenderTargetContext.Provider value={target}>
      <MemoryRouter initialEntries={[START]}>
        {node}
        <PathProbe />
      </MemoryRouter>
    </RenderTargetContext.Provider>,
  );
}

const reason = (label: string) => screen.getByRole("link", { name: new RegExp(label, "i") });
const currentPath = () => screen.getByTestId("path").textContent;
const askedFor = () => useSceneStore.getState().mailPreset;

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
      at("live", <ContactFooter page={ELSEWHERE} />);
      wait();
      expect(shimmer()).toBeNull();
    });

    it("shimmers once the visitor has settled on it", () => {
      at("live", <ContactFooter page={ELSEWHERE} />);
      observers.send(true);
      wait();
      expect(shimmer()).not.toBeNull();
    });

    it("shimmers again each time the invitation is followed", () => {
      at(
        "live",
        <>
          <a href={`#${CONTACT_ID}`}>let me know</a>
          <ContactFooter page={ELSEWHERE} />
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

  it("leaves GitHub to the CV, which is not a way to start a conversation", () => {
    at("live", <ContactFooter page={ELSEWHERE} />);
    const github = cv.links.find((link) => link.url.includes("github.com"));
    expect(github).toBeDefined();
    expect(screen.queryByRole("link", { name: github?.label as string })).toBeNull();
  });

  describe("the link to the CV", () => {
    it("points a reader at the CV from any other page", () => {
      at("live", <ContactFooter page={ELSEWHERE} />);
      expect(screen.getByRole("link", { name: CV_LINK_LABEL })).toHaveAttribute(
        "href",
        blogPaths.cv,
      );
    });

    it("stays in the same tab, since the CV is a page on this site", () => {
      at("live", <ContactFooter page={ELSEWHERE} />);
      expect(screen.getByRole("link", { name: CV_LINK_LABEL })).not.toHaveAttribute("target");
    });

    it("offers no link to the page the reader is already on", () => {
      at("live", <ContactFooter page={ON_THE_CV} />);
      expect(screen.queryByRole("link", { name: CV_LINK_LABEL })).toBeNull();
    });

    it("is there for a visitor with no script, as a plain anchor", () => {
      at("static", <ContactFooter page={ELSEWHERE} />);
      expect(screen.getByRole("link", { name: CV_LINK_LABEL })).toHaveAttribute(
        "href",
        blogPaths.cv,
      );
    });
  });

  // Real timers here: `userEvent` schedules its own, and the fake ones above
  // would leave every click awaiting a tick that never comes.
  describe("the rail of reasons", () => {
    beforeEach(() => {
      observers = watchIntersections();
      useSceneStore.getState().closeAllWindows();
    });

    afterEach(() => {
      observers.restore();
      useSceneStore.getState().closeAllWindows();
    });

    it("names every reason it can start a note about", () => {
      at("live", <ContactFooter page={ELSEWHERE} />);
      for (const preset of MAIL_PRESETS) {
        expect(reason(preset.label)).toBeInTheDocument();
      }
    });

    it("names the rail for a reader who cannot see it sits beside the heading", () => {
      at("live", <ContactFooter page={ELSEWHERE} />);
      expect(screen.getByRole("list", { name: RAIL_LABEL })).toBeInTheDocument();
    });

    describe("prerendered, with no script running", () => {
      // The whole reason the rail is anchors: a visitor with no script gets the
      // same template, in their own mail client, from the same click.
      it("points each reason at a mailto carrying that template", () => {
        at("static", <ContactFooter page={ELSEWHERE} />);
        for (const preset of MAIL_PRESETS) {
          expect(reason(preset.label)).toHaveAttribute("href", presetMailto(MAILTO, preset));
        }
      });

      it("carries the subject and the body a template fills in", () => {
        at("static", <ContactFooter page={ELSEWHERE} />);
        const href = reason(mailPreset("bug").label).getAttribute("href") ?? "";
        const query = new URLSearchParams(href.slice(href.indexOf("?") + 1));
        expect(query.get("subject")).toBe(mailPreset("bug").subject);
        expect(query.get("body")).toBe(mailPreset("bug").body);
      });

      it("asks nothing of the free-form reason beyond the address", () => {
        at("static", <ContactFooter page={ELSEWHERE} />);
        expect(reason(mailPreset("other").label)).toHaveAttribute("href", MAILTO);
      });

      it("leaves the email link alone", () => {
        at("static", <ContactFooter page={ELSEWHERE} />);
        expect(screen.getByRole("link", { name: EMAIL_LABEL })).toHaveAttribute("href", MAILTO);
      });

      it("goes nowhere, because there is no desktop to open a window on", async () => {
        at("static", <ContactFooter page={ELSEWHERE} />);
        await userEvent.click(reason(mailPreset("bug").label));
        expect(currentPath()).toBe(START);
      });
    });

    describe("live", () => {
      it("keeps the mailto href, so a copied link still reaches me", () => {
        at("live", <ContactFooter page={ELSEWHERE} />);
        expect(reason(mailPreset("bug").label)).toHaveAttribute(
          "href",
          presetMailto(MAILTO, mailPreset("bug")),
        );
      });

      it("opens MouseMail on the reason that was picked", async () => {
        at("live", <ContactFooter page={ELSEWHERE} />);
        await userEvent.click(reason(mailPreset("work").label));
        expect(currentPath()).toBe(WINDOW_MAIL);
        expect(askedFor()).toBe("work");
      });

      it("opens the same window from the email address, on no template", async () => {
        at("live", <ContactFooter page={ELSEWHERE} />);
        await userEvent.click(screen.getByRole("link", { name: EMAIL_LABEL }));
        expect(currentPath()).toBe(WINDOW_MAIL);
        expect(askedFor()).toBeNull();
      });

      it("re-aims the window a second reason is clicked on", async () => {
        at("live", <ContactFooter page={ELSEWHERE} />);
        await userEvent.click(reason(mailPreset("bug").label));
        await userEvent.click(reason(mailPreset("feedback").label));
        expect(currentPath()).toBe(WINDOW_MAIL);
        expect(askedFor()).toBe("feedback");
      });

      it("leaves the other profile links as plain links", async () => {
        at("live", <ContactFooter page={ELSEWHERE} />);
        const linkedin = cv.links.find((link) => link.url.includes("linkedin.com"));
        await userEvent.click(screen.getByRole("link", { name: linkedin?.label as string }));
        expect(currentPath()).toBe(START);
      });

      // A reader holding a modifier wants a new tab or the address on the
      // clipboard; taking the click would steal a browser affordance.
      it("stays out of the way of a modified click", async () => {
        // One `setup()` instance, not the direct API: each direct call builds
        // its own instance, so a modifier held by one is forgotten by the next.
        const user = userEvent.setup();
        at("live", <ContactFooter page={ELSEWHERE} />);
        await user.keyboard("[ControlLeft>]");
        await user.click(reason(mailPreset("bug").label));
        await user.keyboard("[/ControlLeft]");
        expect(currentPath()).toBe(START);
      });
    });
  });
});
