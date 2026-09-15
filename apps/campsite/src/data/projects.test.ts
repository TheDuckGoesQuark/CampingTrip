import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { listedProjects, projects } from "./projects";

const PUBLIC_DIR = resolve(__dirname, "../../public");

describe("projects data", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
  });

  it("each project has the required fields", () => {
    for (const project of projects) {
      expect(typeof project.title).toBe("string");
      expect(typeof project.description).toBe("string");
      expect(typeof project.year).toBe("number");
      if (project.color !== undefined) {
        expect(typeof project.color).toBe("string");
      }
    }
  });

  it("project URLs, where there is somewhere to visit, are absolute", () => {
    for (const project of projects) {
      if (project.url === undefined) continue;
      expect(project.url).toMatch(/^https?:\/\//);
    }
  });

  it("project years are reasonable", () => {
    for (const project of projects) {
      expect(project.year).toBeGreaterThanOrEqual(2000);
      expect(project.year).toBeLessThanOrEqual(new Date().getFullYear() + 1);
    }
  });

  it("keeps an unlisted project's page while leaving it off the homepage", () => {
    const unlisted = projects.filter((project) => project.listed === false);
    expect(unlisted.length).toBeGreaterThan(0);
    for (const project of unlisted) expect(listedProjects).not.toContain(project);
    for (const project of listedProjects) expect(projects).toContain(project);
  });

  it("ships every icon it names, so a tile never shows a broken image", () => {
    for (const project of projects) {
      if (!project.icon) continue;
      expect(existsSync(resolve(PUBLIC_DIR, project.icon)), project.icon).toBe(true);
    }
  });
});
