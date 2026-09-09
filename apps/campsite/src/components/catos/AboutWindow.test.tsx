import { BrandProvider } from "@jordanscamp/ds";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AboutWindow, { uptimeSince } from "./AboutWindow";

const BOOTED_AT = Date.parse("1997-09-17T21:00:00+01:00");
const at = (iso: string) => Date.parse(iso);

describe("uptimeSince", () => {
  it("counts whole days and the clock beneath them", () => {
    expect(uptimeSince(BOOTED_AT, at("1997-09-17T21:00:00+01:00"))).toBe("0 days 00:00:00");
    expect(uptimeSince(BOOTED_AT, at("1997-09-18T21:00:00+01:00"))).toBe("1 days 00:00:00");
    expect(uptimeSince(BOOTED_AT, at("1997-09-18T22:34:56+01:00"))).toBe("1 days 01:34:56");
  });

  it("pads each field to two digits, so the line does not change width", () => {
    expect(uptimeSince(BOOTED_AT, at("1997-09-17T21:01:02+01:00"))).toBe("0 days 00:01:02");
  });

  it("counts from a fixed instant, not from local wall-clock time", () => {
    expect(uptimeSince(BOOTED_AT, at("1997-09-17T20:00:00Z"))).toBe("0 days 00:00:00");
  });

  it("never runs backwards when the clock is behind the start", () => {
    expect(uptimeSince(BOOTED_AT, at("1990-01-01T00:00:00Z"))).toBe("0 days 00:00:00");
  });
});

describe("AboutWindow", () => {
  afterEach(() => vi.useRealTimers());

  it("ticks the uptime every second", () => {
    vi.useFakeTimers();
    vi.setSystemTime(at("2026-09-09T12:00:00Z"));
    render(
      <BrandProvider>
        <AboutWindow onClose={() => {}} />
      </BrandProvider>,
    );

    const first = screen.getByText(/^\d+ days \d\d:\d\d:\d\d$/).textContent;
    act(() => void vi.advanceTimersByTime(1000));
    expect(screen.getByText(/^\d+ days \d\d:\d\d:\d\d$/).textContent).not.toBe(first);
  });

  it("lists the specs it claims to have", () => {
    render(
      <BrandProvider>
        <AboutWindow onClose={() => {}} />
      </BrandProvider>,
    );
    expect(screen.getByText(/Version 9, "Smittens"/)).toBeInTheDocument();
    expect(screen.getByText(/Memory: Infinite, but session scoped/)).toBeInTheDocument();
    expect(screen.getByText(/Storage: Unknown/)).toBeInTheDocument();
  });
});
