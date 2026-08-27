import { describe, expect, it } from "vitest";

import { dayOfMonth, formatDate, monthAndYear } from "./formatDate";

describe("formatDate", () => {
  it("formats in UTC, so a reader west of Greenwich sees the authored day", () => {
    expect(formatDate("2026-08-14")).toBe("14 August 2026");
    expect(formatDate("2026-08-14", "short")).toBe("14 Aug 2026");
  });

  it("keeps the first of the month on the first", () => {
    expect(formatDate("2026-01-01")).toBe("1 January 2026");
  });
});

describe("the feed's date gutter", () => {
  it("splits a date into a padded day and a short month and year", () => {
    expect(dayOfMonth("2026-07-02")).toBe("02");
    expect(monthAndYear("2026-07-02")).toBe("JUL 26");
  });
});
