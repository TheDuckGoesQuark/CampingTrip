import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { blogPaths } from "../routing/blogPaths";
import { cv } from "./cv";
import { personalWork, professionalWork } from "./work";

const PUBLIC_DIR = resolve(__dirname, "../../public");

describe("the homepage's two columns", () => {
  it("shows every listed project down the personal column", () => {
    expect(personalWork.map((item) => item.title)).toEqual([
      "JordansCamp.Site",
      "CatMap",
      "Music Production",
    ]);
  });

  it("keeps a card only while the CV still lists that role", () => {
    const orgs = new Set(cv.experience.map((role) => role.org));
    expect(orgs.has("Lindus Health") && orgs.has("Gravity Sketch")).toBe(true);
  });

  it("shows all three professional cards, rather than quietly shrinking the column", () => {
    expect(professionalWork.map((item) => item.title)).toEqual([
      "Lindus",
      "Gravity Sketch",
      "MultiAgent Systems",
    ]);
  });

  it("ships every logo it names, so a tile never shows a broken image", () => {
    for (const item of [...personalWork, ...professionalWork]) {
      if (!item.icon) continue;
      expect(existsSync(resolve(PUBLIC_DIR, item.icon)), item.icon).toBe(true);
    }
  });

  it("sends the professional column to the CV and the personal one to project pages", () => {
    for (const item of professionalWork) expect(item.to).toBe(blogPaths.cv);
    for (const item of personalWork) expect(item.to).toMatch(/^\/blog\/projects\//);
  });
});
