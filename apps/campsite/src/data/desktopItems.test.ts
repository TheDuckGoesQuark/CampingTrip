import { describe, expect, it } from "vitest";

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

  it("keeps exactly one launcher, so the rail is a junk drawer and not an index", () => {
    expect(desktopItems.filter((item) => item.kind === "app")).toHaveLength(1);
  });
});
