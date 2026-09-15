import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { bookmarks } from "./bookmarks";

const PUBLIC_DIR = resolve(__dirname, "../../public");

describe("bookmarks data", () => {
  it("ships every icon it names, so a tile never shows a broken image", () => {
    for (const bookmark of bookmarks) {
      expect(existsSync(resolve(PUBLIC_DIR, bookmark.icon)), bookmark.icon).toBe(true);
    }
  });
});
