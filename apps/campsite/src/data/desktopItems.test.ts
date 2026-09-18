import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { blogPaths } from "../routing/blogPaths";
import { routes } from "../routing/navigation";
import {
  desktopItems,
  desktopItemSlug,
  findDesktopItem,
  MODEL_CREDITS,
  SOUND_CREDITS,
} from "./desktopItems";

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

  it("launches one page and leaves by one door, so the desktop is not an index", () => {
    const launchers = desktopItems.filter((item) => item.kind === "app");
    expect(launchers.map((item) => item.opens)).toEqual([blogPaths.home, routes.tent]);
  });

  it("keeps the way outside above the junk, so it lands top-left on any screen", () => {
    const outside = desktopItems.findIndex(
      (item) => item.kind === "app" && item.opens === routes.tent,
    );
    expect(outside).toBeLessThan(2);
  });

  /**
   * CC-BY requires the attribution to travel with the work, so the credits a
   * visitor can open and the credits table in the README have to name the same
   * models. They are written in two places because they serve two readers, and
   * nothing but this test stops one gaining a model the other never hears about.
   */
  it("credits every model the README credits, and no others", () => {
    const readme = readFileSync(join(__dirname, "../../../../README.md"), "utf8");
    const table = readme
      .split("## 3D model credits")[1]
      .split("\n")
      .filter(
        (line) => line.startsWith("| ") && !line.startsWith("| Model") && !line.includes("---"),
      )
      .map((line) => line.split("|")[1].trim());

    expect(MODEL_CREDITS.map((credit) => credit.model).sort()).toEqual(table.sort());
  });

  it("names the same recordings as the ambience doc, which carries the licence", () => {
    const doc = readFileSync(join(__dirname, "../../../../docs/ambience-beds.md"), "utf8");
    for (const { by, url } of SOUND_CREDITS) {
      expect(doc).toContain(by);
      expect(doc).toContain(url);
    }
  });

  it("puts every credited work, and a link for it, in the file a visitor opens", () => {
    const credits = desktopItems.find((item) => item.label === "credits.txt");
    const body = (credits as { body: string }).body;
    for (const { model, url } of MODEL_CREDITS) {
      expect(body).toContain(model);
      expect(body).toContain(url);
    }
    for (const { by, url } of SOUND_CREDITS) {
      expect(body).toContain(by);
      expect(body).toContain(url);
    }
  });
});
