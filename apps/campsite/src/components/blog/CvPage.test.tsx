import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { cv } from "../../data/cv";
import CvPage, { CV_SECTIONS } from "./CvPage";

// The narrative's links go through react-router's `Link`, which needs a router ancestor.
function renderCv() {
  return render(
    <MemoryRouter>
      <CvPage cv={cv} />
    </MemoryRouter>,
  );
}

describe("CvPage", () => {
  it("heads the document with the name alone", () => {
    renderCv();
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual([
      cv.name,
    ]);
  });

  it("uses the standard section headings, in order", () => {
    renderCv();
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(
      CV_SECTIONS.filter((name) => name !== "Commendations" || cv.commendations.length > 0),
    );
  });

  it("attributes a commendation outside the quote, and never as a cite", () => {
    renderCv();
    const quote = document.querySelector("blockquote")!;
    const caption = document.querySelector("figure > figcaption")!;
    const [first] = cv.commendations;

    expect(quote.textContent).toBe(first.quote);
    expect(caption.textContent).toBe(first.attribution);
    expect(quote.textContent).not.toContain(first.attribution);
    expect(document.querySelector("cite")).toBeNull();
  });

  it("names nobody, and no employer, in the commendations", () => {
    const text = [
      cv.commendationsNote ?? "",
      ...cv.commendations.flatMap((c) => [c.quote, c.attribution]),
    ].join(" ");
    expect(text).not.toMatch(/Lindus|Citrus/i);
    // Quoted verbatim from an internal channel, so a stray @name would republish one.
    expect(text).not.toContain("@");
  });

  it("writes every date as a month a parser recognises", () => {
    renderCv();
    for (const time of document.querySelectorAll("time")) {
      const text = time.textContent ?? "";
      if (text.includes(" ")) {
        expect(text).toMatch(
          /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$|^\d{1,2} \w+ \d{4}$/,
        );
      }
    }
  });

  it("keeps the icons out of the accessible text", () => {
    renderCv();
    const article = screen.getByRole("article");
    for (const svg of within(article).queryAllByRole("img")) {
      expect(svg.getAttribute("aria-label")).toBeTruthy();
    }
    expect(article.querySelectorAll("svg[aria-hidden='true']").length).toBeGreaterThan(0);
  });

  it("lists the location and every contact link in the header", () => {
    renderCv();
    const header = screen.getByRole("banner");
    if (cv.location) expect(header.textContent).toContain(cv.location);
    for (const link of cv.links) {
      expect(within(header).getByRole("link", { name: new RegExp(link.label) })).toHaveAttribute(
        "href",
        link.url,
      );
    }
  });

  it("jumps the narrative's Lindus Health mention to that role's card", () => {
    renderCv();
    const lindusRole = cv.experience.find((role) => role.org === "Lindus Health")!;
    const narrativeLink = screen.getAllByRole("link", { name: "Lindus Health" })[0];
    const target = document.querySelector(narrativeLink.getAttribute("href")!);
    expect(target).not.toBeNull();
    expect(target!.textContent).toContain(lindusRole.title);
  });

  it("prints every skill, including the group that spans the grid", () => {
    renderCv();
    const skills = screen.getByRole("heading", { name: "Skills" }).closest("section")!;
    for (const group of cv.skills) {
      expect(within(skills).getByText(group.group)).toBeInTheDocument();
      for (const item of group.items) {
        expect(within(skills).getByText(item)).toBeInTheDocument();
      }
    }
  });

  it("names every achievement at a level under its role, skipping none", () => {
    renderCv();
    const levels = [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => Number(h.tagName[1]));
    for (const [i, level] of levels.entries()) {
      if (i > 0) expect(level).toBeLessThanOrEqual(levels[i - 1] + 1);
    }
  });

  it("labels each achievement facet against its own value, and omits the empty ones", () => {
    renderCv();
    const lindus = cv.experience.find((role) => role.org === "Lindus Health")!;
    const course = lindus.achievements!.find((a) => a.name === "Spreading the Joy (of React)")!;
    const heading = screen.getByRole("heading", { name: course.name, level: 4 });
    const facets = heading.parentElement!.querySelector("dl")!;
    const labels = [...facets.querySelectorAll("dt")].map((dt) => dt.textContent);

    // Taking a course has no feature and no difficulty, so those pairs are absent rather than empty.
    expect(labels).toEqual(["Outcome", "Approach"]);
    expect(facets.querySelectorAll("dd")).toHaveLength(labels.length);
    expect(facets.querySelector("dd")!.textContent).toBe(course.outcome);
  });

  it("routes the narrative's CatMaps mention to the project page, not the product site", () => {
    renderCv();
    const link = screen.getByRole("link", { name: "CatMaps" });
    expect(link).toHaveAttribute("href", "/blog/projects/catmap.html");
  });

  it("carries a link named inside an achievement facet offsite", () => {
    renderCv();
    const link = screen.getByRole("link", { name: "Joy of React" });
    expect(link).toHaveAttribute("href", "https://www.joyofreact.com");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
