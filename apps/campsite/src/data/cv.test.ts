import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { resolveBlogPage } from "./blogPages";
import { cv } from "./cv";
import { projects } from "./projects";

const PUBLIC_DIR = resolve(__dirname, "../../public");

describe("the CV", () => {
  it("ships every logo it names", () => {
    const logos = [...cv.experience, ...cv.education].flatMap((entry) =>
      entry.logo ? [entry.logo] : [],
    );
    expect(logos.length).toBeGreaterThan(0);
    for (const logo of logos) expect(existsSync(resolve(PUBLIC_DIR, logo)), logo).toBe(true);
  });

  it("links every organisation to an https site or to nothing", () => {
    for (const entry of [...cv.experience, ...cv.education]) {
      if (entry.url) expect(entry.url).toMatch(/^https:\/\//);
    }
  });

  it("points the narrative's CatMaps mention at a project that still exists", () => {
    expect(projects.some((project) => project.title === "CatMaps")).toBe(true);
    expect(resolveBlogPage({ kind: "project", slug: "catmaps" })).not.toBeNull();
  });
});
