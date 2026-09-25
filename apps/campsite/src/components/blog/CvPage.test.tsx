import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { contactLabel, contactMailto } from "../../data/contactEmail";
import { cv } from "../../data/cv";
import { mailPreset } from "../../data/mailPresets";
import { SITE_ORIGIN } from "../../data/site";
import { RenderTargetContext, type RenderTarget } from "../../prerender/renderTarget";
import { blogPaths } from "../../routing/blogPaths";
import { WINDOW_MAIL } from "../../routing/windows";
import { useSceneStore } from "../../store/sceneStore";
import CvPage, { CV_SECTIONS } from "./CvPage";

vi.mock("../../audio/soundEffects", () => ({ playWindowOpen: vi.fn() }));

// The narrative's links go through react-router's `Link`, which needs a router ancestor.
function renderCv() {
  return render(
    <MemoryRouter>
      <CvPage cv={cv} />
    </MemoryRouter>,
  );
}

function PathProbe() {
  return <span data-testid="path">{useLocation().pathname}</span>;
}

function renderCvAt(target: RenderTarget) {
  return render(
    <RenderTargetContext.Provider value={target}>
      <MemoryRouter initialEntries={[blogPaths.cv]}>
        <CvPage cv={cv} />
        <PathProbe />
      </MemoryRouter>
    </RenderTargetContext.Provider>,
  );
}

const emailLink = () => screen.getByRole("link", { name: contactLabel as string });
const currentPath = () => screen.getByTestId("path").textContent;
const askedFor = () => useSceneStore.getState().mailPreset;

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
    if (cv.citizenship) expect(header.textContent).toContain(cv.citizenship.label);
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
    const facets = heading.parentElement!.nextElementSibling!;
    const labels = [...facets.querySelectorAll("dt")].map((dt) => dt.textContent);

    // Taking a course has no feature and no difficulty, so those pairs are absent rather than empty.
    expect(labels).toEqual(["Outcome", "Approach"]);
    expect(facets.querySelectorAll("dd")).toHaveLength(labels.length);
    expect(facets.querySelector("dd")!.textContent).toBe(course.outcome);
  });

  it("routes the narrative's CatMaps mention to the project page, not the product site", () => {
    renderCv();
    const link = screen.getByRole("link", { name: "CatMaps" });
    expect(link).toHaveAttribute("href", "/blog/projects/catmaps.html");
  });

  describe("the header's email address", () => {
    beforeEach(() => {
      useSceneStore.getState().setMailPreset(null);
    });

    it("opens MouseMail on the hiring template", async () => {
      renderCvAt("live");
      await userEvent.click(emailLink());

      expect(currentPath()).toBe(WINDOW_MAIL);
      expect(askedFor()).toBe(mailPreset("work").id);
    });

    it("stays an untouched mailto on the static copy", async () => {
      renderCvAt("static");
      expect(emailLink()).toHaveAttribute("href", contactMailto);

      await userEvent.click(emailLink());
      expect(currentPath()).toBe(blogPaths.cv);
      expect(askedFor()).toBeNull();
    });

    it("leaves the address itself clickable in a mail client", () => {
      renderCvAt("live");
      expect(emailLink()).toHaveAttribute("href", contactMailto);
    });
  });

  it("hangs each coursework link on its subject, and leaves the unlinked ones as text", () => {
    renderCv();
    const education = screen.getByRole("heading", { name: "Education" }).parentElement!;

    const lines = within(education).getAllByRole("listitem");

    for (const { subject, detail, url } of cv.education.flatMap((e) => e.coursework ?? [])) {
      const line = lines.find((li) => li.textContent?.startsWith(`${subject}:`))!;
      expect(line.textContent).toBe(`${subject}: ${detail}`);

      const link = within(line).queryByRole("link");
      if (url === undefined) expect(link).toBeNull();
      else expect(link).toHaveAttribute("href", url);
    }
  });

  it("sends an achievement naming a post to that post, and leaves the rest unlinked", () => {
    renderCv();
    const links = screen.getAllByRole("link", { name: "read the blog post" });
    expect(links).toHaveLength(
      cv.experience.flatMap((r) => r.achievements ?? []).filter((a) => a.postSlug).length,
    );
    expect(links[0]).toHaveAttribute(
      "href",
      "/blog/posts/how-i-got-our-designers-writing-production-code.html",
    );
  });

  it("carries the origin on that link in the copy the PDF is printed from", () => {
    renderCvAt("static");
    expect(screen.getAllByRole("link", { name: "read the blog post" })[0]).toHaveAttribute(
      "href",
      `${SITE_ORIGIN}/blog/posts/how-i-got-our-designers-writing-production-code.html`,
    );
  });

  it("carries a link named inside an achievement facet offsite", () => {
    renderCv();
    const link = screen.getByRole("link", { name: "Joy of React" });
    expect(link).toHaveAttribute("href", "https://www.joyofreact.com");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
