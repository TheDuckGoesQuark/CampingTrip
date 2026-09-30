import { BrandProvider } from "@jordanscamp/ds";
import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { counterUrl, SITE_WIDE } from "../../analytics/visitorCounts";
import { published } from "../../data/posts";
import { slugify } from "../../data/slug";
import { blogPaths } from "../../routing/blogPaths";
import { useSceneStore } from "../../store/sceneStore";
import ActivityWindow, { KERNEL_MB, memoryInUse, WINDOW_MB } from "./ActivityWindow";

const json = (count: string, status = 200) =>
  new Response(JSON.stringify({ count, count_unique: count }), { status });

/** A stats host with 2 visits a day site-wide and a few more on the first post. */
function statsHost(input: URL | RequestInfo) {
  const url = new URL(String(input));
  const start = url.searchParams.get("start");
  if (url.pathname === `/counter/${SITE_WIDE}.json`) {
    if (start === null) return Promise.resolve(json("1 234"));
    const daysAgo = Math.round((Date.now() - Date.parse(start)) / 86_400_000);
    return Promise.resolve(json(String(2 * (daysAgo + 1))));
  }
  const first = counterUrl(blogPaths.post(slugify(published[0].title)));
  return Promise.resolve(url.toString() === first ? json("9") : json("0", 404));
}

const renderWindow = () =>
  render(
    <BrandProvider>
      <ActivityWindow onClose={() => {}} />
    </BrandProvider>,
  );

beforeEach(() => {
  useSceneStore.setState({ openWindows: [blogPaths.activity] });
  vi.stubGlobal("fetch", vi.fn(statsHost));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("memoryInUse", () => {
  it("charges the kernel and then each open window", () => {
    expect(memoryInUse(0)).toBe(KERNEL_MB);
    expect(memoryInUse(3)).toBe(KERNEL_MB + 3 * WINDOW_MB);
  });
});

describe("ActivityWindow", () => {
  it("lists every published post as a process, busiest first", async () => {
    renderWindow();
    await screen.findByText(published[0].title);
    const bodyRows = screen.getAllByRole("row").slice(1);
    expect(bodyRows).toHaveLength(published.length);
    expect(within(bodyRows[0]).getByText(published[0].title)).toBeInTheDocument();
    expect(within(bodyRows[0]).getByText("9")).toBeInTheDocument();
    for (const post of published) expect(screen.getByText(post.title)).toBeInTheDocument();
  });

  it("draws one bar per day and says what the bars add up to", async () => {
    renderWindow();
    const graph = await screen.findByRole("img", { name: /over the last 14 days/ });
    expect(graph.querySelectorAll("rect").length).toBe(1 + 14);
    expect(screen.getByText(/^\d+ in the period$/)).toBeInTheDocument();
  });

  it("puts the site's all-time total in the status bar", async () => {
    renderWindow();
    expect(await screen.findByText("1,234 visitors all time.")).toBeInTheDocument();
  });

  it("says so when the stats host will not answer, after asking it once", async () => {
    const refused = vi.fn(() => Promise.resolve(new Response("", { status: 403 })));
    vi.stubGlobal("fetch", refused);
    renderWindow();
    expect(
      await screen.findByText("Visitor counts are unavailable right now."),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "No visitor data" })).toBeInTheDocument();
    expect(refused).toHaveBeenCalledTimes(1);
    for (const post of published) expect(screen.getByText(post.title)).toBeInTheDocument();
  });

  it("samples the session's memory once a second from the windows open", async () => {
    vi.useFakeTimers();
    renderWindow();
    const used = memoryInUse(1);
    expect(screen.getByText(`${used} MB in use, ∞ free`)).toBeInTheDocument();
    act(() => {
      useSceneStore.setState({ openWindows: [blogPaths.activity, blogPaths.about] });
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(`${memoryInUse(2)} MB in use, ∞ free`)).toBeInTheDocument();
  });
});
