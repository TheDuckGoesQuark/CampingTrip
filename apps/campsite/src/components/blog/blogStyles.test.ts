import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const SHEET = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "blog.module.css"),
  "utf8",
);

const rule = (name: string) =>
  new RegExp(String.raw`^\.${name}\s*\{([\s\S]*?)^\}`, "m").exec(SHEET)?.[1] ?? "";

/**
 * These read the stylesheet rather than a render, because a render cannot show
 * it: Vitest resolves a CSS-module class name but not `composes`, so
 * `styles.rowTags` is one class here and two in a browser. A variant that lost
 * its base would therefore still look right to `toHaveClass`, which is how one
 * reached the site once already.
 */
describe("the blog's shared stylesheet", () => {
  it("builds the scrolling tag row on the tag list, so it is still a flex row", () => {
    expect(rule("rowTags")).toMatch(/composes:\s*tagList\s*;/);
  });

  it("keeps the two disagreeing on wrap, which is the whole point of the variant", () => {
    expect(rule("tagList")).toMatch(/flex-wrap:\s*wrap\s*;/);
    expect(rule("rowTags")).toMatch(/flex-wrap:\s*nowrap\s*;/);
  });

  it("declares the base before the variant, since source order settles that", () => {
    expect(SHEET.indexOf(".tagList {")).toBeLessThan(SHEET.indexOf(".rowTags {"));
  });
});
