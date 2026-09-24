import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SegmentedNav } from "./SegmentedNav";

describe("SegmentedNav", () => {
  function Cv({ current }: { current: "full" | "condensed" }) {
    return (
      <SegmentedNav aria-label="Length of this CV">
        <SegmentedNav.Item
          current={current === "full"}
          render={current === "full" ? undefined : <a href="/cv" />}
        >
          Full
        </SegmentedNav.Item>
        <SegmentedNav.Item
          current={current === "condensed"}
          render={current === "condensed" ? undefined : <a href="/cv-short" />}
        >
          Condensed
        </SegmentedNav.Item>
      </SegmentedNav>
    );
  }

  const nav = () => within(screen.getByRole("navigation", { name: "Length of this CV" }));

  it("is a list of segments inside a named nav", () => {
    render(<Cv current="full" />);
    expect(
      nav()
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["Full", "Condensed"]);
  });

  it("leaves the current segment a span, and the rest links", () => {
    render(<Cv current="full" />);

    const links = nav().getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("Condensed");

    const current = nav().getByText("Full");
    expect(current.tagName).toBe("SPAN");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("marks no segment current where none is", () => {
    render(
      <SegmentedNav aria-label="Views">
        <SegmentedNav.Item render={<a href="/a" />}>A</SegmentedNav.Item>
        <SegmentedNav.Item render={<a href="/b" />}>B</SegmentedNav.Item>
      </SegmentedNav>,
    );
    expect(document.querySelector("[aria-current]")).toBeNull();
  });
});
