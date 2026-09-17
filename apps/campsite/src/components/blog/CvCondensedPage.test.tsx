import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { cv } from "../../data/cv";
import { blogPaths } from "../../routing/blogPaths";
import CvCondensedPage, { condensedBullets, CV_CONDENSED_SECTIONS } from "./CvCondensedPage";
import { VARIANT_LABELS, VARIANT_NAV_LABEL } from "./CvHeader";

vi.mock("../../audio/soundEffects", () => ({ playWindowOpen: vi.fn() }));

function renderCondensed() {
  return render(
    <MemoryRouter initialEntries={[blogPaths.cvCondensed]}>
      <CvCondensedPage cv={cv} />
    </MemoryRouter>,
  );
}

const theSwitch = () => within(screen.getByRole("navigation", { name: VARIANT_NAV_LABEL }));

describe("CvCondensedPage", () => {
  it("uses the standard section headings, in order", () => {
    renderCondensed();
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([...CV_CONDENSED_SECTIONS]);
  });

  it("leaves out the sections the full CV keeps for a reader with more time", () => {
    renderCondensed();
    for (const dropped of ["Commendations"]) {
      expect(screen.queryByRole("heading", { name: dropped })).toBeNull();
    }
    expect(document.querySelector("blockquote")).toBeNull();
  });

  it("opens on the profile rather than the narrative", () => {
    renderCondensed();
    expect(screen.getByText(cv.profile)).toBeInTheDocument();
  });

  it("prints every role, newest first, with its dates", () => {
    renderCondensed();
    const experience = screen.getByRole("heading", { name: "Experience" }).closest("section")!;
    const roles = within(experience).getAllByRole("heading", { level: 3 });
    expect(roles).toHaveLength(cv.experience.length);
    for (const [i, role] of cv.experience.entries()) {
      expect(roles[i].textContent).toBe(`${role.title}, ${role.org}`);
    }
  });

  /* A `dl` under Experience would mean an achievement's long form had leaked in. */
  it("carries no achievement facets", () => {
    renderCondensed();
    const experience = screen.getByRole("heading", { name: "Experience" }).closest("section")!;
    expect(experience.querySelector("dl")).toBeNull();
    expect(within(experience).queryByText("Difficulty")).toBeNull();
  });

  it("takes an achievement onto the page only when it carries a short form", () => {
    const lindus = cv.experience.find((role) => role.org === "Lindus Health")!;
    const chosen = lindus.achievements!.filter((a) => a.short !== undefined);

    expect(chosen.length).toBeGreaterThan(0);
    expect(chosen.length).toBeLessThan(lindus.achievements!.length);
    expect(condensedBullets(lindus)).toEqual(chosen.map((a) => a.short));
  });

  it("falls back to a role's own highlights when it names no achievements", () => {
    const gravity = cv.experience.find((role) => role.org === "Gravity Sketch")!;
    expect(gravity.achievements).toBeUndefined();
    expect(condensedBullets(gravity)).toEqual(gravity.highlights);
  });

  it("gives each project and each qualification a single line", () => {
    renderCondensed();
    for (const [name, expected] of [
      ["Projects", cv.projects.length],
      ["Education", cv.education.length],
    ] as const) {
      const section = screen.getByRole("heading", { name }).closest("section")!;
      expect(within(section).getAllByRole("listitem"), name).toHaveLength(expected);
    }
  });

  it("writes every date as a month a parser recognises", () => {
    renderCondensed();
    for (const time of document.querySelectorAll("time")) {
      expect(time.getAttribute("datetime")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(time.textContent).toMatch(
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$|^\d{1,2} \w+ \d{4}$/,
      );
    }
  });

  describe("the switch between the two CVs", () => {
    it("names both lengths, in the same order on either CV", () => {
      renderCondensed();
      expect(
        theSwitch()
          .getAllByRole("listitem")
          .map((li) => li.textContent),
      ).toEqual([VARIANT_LABELS.full, VARIANT_LABELS.condensed]);
    });

    it("offers the other length as the only link, and marks this one current", () => {
      renderCondensed();
      const links = theSwitch().getAllByRole("link");

      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAccessibleName(VARIANT_LABELS.full);
      expect(links[0]).toHaveAttribute("href", blogPaths.cv);

      const current = theSwitch().getByText(VARIANT_LABELS.condensed);
      expect(current).toHaveAttribute("aria-current", "page");
      expect(current.closest("a")).toBeNull();
    });

    it("sits on the name's line, so it is found where another form is looked for", () => {
      renderCondensed();
      const name = screen.getByRole("heading", { level: 1 });
      const nav = screen.getByRole("navigation", { name: VARIANT_NAV_LABEL });
      expect(name.parentElement).toBe(nav.parentElement);
    });
  });

  it("offers the condensed PDF, not the full one", () => {
    renderCondensed();
    const download = screen.getByRole("link", { name: "Download PDF" });
    expect(download).toHaveAttribute("href", blogPaths.cvCondensedPdf);
    expect(download).toHaveAttribute("download");
  });
});
