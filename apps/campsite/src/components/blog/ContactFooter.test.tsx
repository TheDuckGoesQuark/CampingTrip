import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { watchIntersections } from "../../test/intersection";
import ContactFooter, { CONTACT_HEADING, CONTACT_ID } from "./ContactFooter";

import styles from "./blog.module.css";

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

describe("ContactFooter", () => {
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
