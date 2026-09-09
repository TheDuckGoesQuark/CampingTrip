import { describe, expect, it } from "vitest";

import { blogPaths } from "../routing/blogPaths";
import { routes } from "../routing/navigation";
import { desktopItems, desktopItemSlug, findDesktopItem } from "./desktopItems";

describe("desktopItems", () => {
  it("gives every item a distinct slug, so a URL names exactly one", () => {
    const slugs = desktopItems.map(desktopItemSlug);
    expect(new Set(slugs).size).toBe(desktopItems.length);
  });

  it("produces a URL-safe slug from a filename", () => {
    expect(desktopItemSlug({ kind: "text", label: "DO_NOT_OPEN.txt", mode: "", body: "" })).toBe(
      "do-not-open-txt",
    );
  });

  it("finds an item by its slug", () => {
    for (const item of desktopItems) {
      expect(findDesktopItem(desktopItemSlug(item))).toBe(item);
    }
  });

  it("returns nothing for a slug that names no item", () => {
    expect(findDesktopItem("not-on-the-desktop")).toBeUndefined();
  });

  it("launches one page and leaves by one door, so the rail is not an index", () => {
    const launchers = desktopItems.filter((item) => item.kind === "app");
    expect(launchers.map((item) => item.opens)).toEqual([blogPaths.home, routes.tent]);
  });

  it("keeps the way outside above the junk, so a short rail still shows it", () => {
    const outside = desktopItems.findIndex(
      (item) => item.kind === "app" && item.opens === routes.tent,
    );
    expect(outside).toBeLessThan(2);
  });
});
