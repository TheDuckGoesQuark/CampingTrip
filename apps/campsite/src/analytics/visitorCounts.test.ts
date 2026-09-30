import { describe, expect, it, vi } from "vitest";

import {
  counterUrl,
  fetchCount,
  fetchDailyCounts,
  isoDay,
  lastDays,
  parseCount,
  SITE_WIDE,
} from "./visitorCounts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("counterUrl", () => {
  it("names a path without its leading slash, and the site by its keyword", () => {
    expect(counterUrl("/blog/index.html")).toBe(
      "https://stats.jordanscamp.site/counter/blog/index.html.json",
    );
    expect(counterUrl(SITE_WIDE)).toBe("https://stats.jordanscamp.site/counter/TOTAL.json");
  });

  it("carries the day the count runs from", () => {
    expect(counterUrl("/blog/", "2026-09-30")).toBe(
      "https://stats.jordanscamp.site/counter/blog/.json?start=2026-09-30",
    );
  });
});

describe("parseCount", () => {
  it("reads a formatted count whatever the separator", () => {
    expect(parseCount({ count: "1 234" })).toBe(1234);
    expect(parseCount({ count: "1,234,567" })).toBe(1234567);
    expect(parseCount({ count: "1.234" })).toBe(1234);
    expect(parseCount({ count: "0" })).toBe(0);
  });

  it("refuses anything that is not a count", () => {
    expect(parseCount({ count: 12 })).toBeNull();
    expect(parseCount({ count: "" })).toBeNull();
    expect(parseCount({})).toBeNull();
    expect(parseCount(null)).toBeNull();
    expect(parseCount("12")).toBeNull();
  });
});

describe("fetchCount", () => {
  it("returns the count on 200", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ count: "42" }));
    await expect(fetchCount("/blog/", undefined, fetchMock)).resolves.toBe(42);
    expect(fetchMock).toHaveBeenCalledWith(counterUrl("/blog/"));
  });

  it("treats a 404 as the zero it carries: nobody has been there", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ count: "0" }, 404));
    await expect(fetchCount("/blog/nowhere.html", undefined, fetchMock)).resolves.toBe(0);
  });

  it("is unavailable when the setting is off, the host fails, or the body is odd", async () => {
    await expect(
      fetchCount("/blog/", undefined, vi.fn().mockResolvedValue(json({}, 403))),
    ).resolves.toBeNull();
    await expect(
      fetchCount("/blog/", undefined, vi.fn().mockRejectedValue(new TypeError("offline"))),
    ).resolves.toBeNull();
    await expect(
      fetchCount("/blog/", undefined, vi.fn().mockResolvedValue(new Response("<html>"))),
    ).resolves.toBeNull();
  });
});

describe("lastDays", () => {
  it("lists UTC days ending today, oldest first, across a month boundary", () => {
    expect(lastDays(3, new Date("2026-10-01T23:30:00Z"))).toEqual([
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
    ]);
    expect(isoDay(new Date("2026-10-01T00:10:00+01:00"))).toBe("2026-09-30");
  });
});

describe("fetchDailyCounts", () => {
  const cumulative: Record<string, string> = {
    "2026-09-28": "10",
    "2026-09-29": "7",
    "2026-09-30": "3",
  };
  const byStart = vi.fn(async (input: URL | RequestInfo) => {
    const start = new URL(String(input)).searchParams.get("start") ?? "";
    return json({ count: cumulative[start] });
  });

  it("turns from-here-to-now counts into one figure per day", async () => {
    await expect(
      fetchDailyCounts(SITE_WIDE, ["2026-09-28", "2026-09-29", "2026-09-30"], byStart),
    ).resolves.toEqual([
      { day: "2026-09-28", count: 3 },
      { day: "2026-09-29", count: 4 },
      { day: "2026-09-30", count: 3 },
    ]);
  });

  it("is unavailable as a whole when any day is, rather than showing a gap as quiet", async () => {
    const flaky = vi.fn(async (input: URL | RequestInfo) =>
      String(input).includes("2026-09-29") ? new Response("", { status: 503 }) : byStart(input),
    );
    await expect(
      fetchDailyCounts(SITE_WIDE, ["2026-09-28", "2026-09-29", "2026-09-30"], flaky),
    ).resolves.toBeNull();
  });
});
