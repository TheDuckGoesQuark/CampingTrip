import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "./SegmentedControl";
import { SegmentedNav } from "./SegmentedNav";

function Range({ onValueChange }: { onValueChange?: (value: string) => void }) {
  return (
    <SegmentedControl defaultValue="week" onValueChange={onValueChange} aria-label="Range">
      <SegmentedControl.Item value="day">Day</SegmentedControl.Item>
      <SegmentedControl.Item value="week">Week</SegmentedControl.Item>
      <SegmentedControl.Item value="month">Month</SegmentedControl.Item>
    </SegmentedControl>
  );
}

const segment = (name: string) => screen.getByRole("button", { name });

describe("SegmentedControl", () => {
  it("presses the segment named by `defaultValue`, and only that one", () => {
    render(<Range />);
    expect(segment("Week")).toHaveAttribute("aria-pressed", "true");
    expect(segment("Day")).toHaveAttribute("aria-pressed", "false");
    expect(segment("Month")).toHaveAttribute("aria-pressed", "false");
  });

  it("moves the choice uncontrolled, and reports the new one", async () => {
    const onValueChange = vi.fn();
    render(<Range onValueChange={onValueChange} />);

    await userEvent.click(segment("Month"));

    expect(onValueChange).toHaveBeenCalledWith("month");
    expect(segment("Month")).toHaveAttribute("aria-pressed", "true");
    expect(segment("Week")).toHaveAttribute("aria-pressed", "false");
  });

  it("stays where a controlled caller puts it, whatever is clicked", async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl value="day" onValueChange={onValueChange} aria-label="Range">
        <SegmentedControl.Item value="day">Day</SegmentedControl.Item>
        <SegmentedControl.Item value="week">Week</SegmentedControl.Item>
      </SegmentedControl>,
    );

    await userEvent.click(segment("Week"));

    expect(onValueChange).toHaveBeenCalledWith("week");
    expect(segment("Day")).toHaveAttribute("aria-pressed", "true");
  });

  /* Base UI clears a pressed toggle, which would leave the control on nothing —
     a state a set of mutually exclusive choices does not have. */
  it("never lands on no choice when the chosen segment is clicked again", async () => {
    const onValueChange = vi.fn();
    function Controlled() {
      const [range, setRange] = useState("day");
      return (
        <SegmentedControl
          value={range}
          onValueChange={(next) => {
            onValueChange(next);
            setRange(next);
          }}
          aria-label="Range"
        >
          <SegmentedControl.Item value="day">Day</SegmentedControl.Item>
          <SegmentedControl.Item value="week">Week</SegmentedControl.Item>
        </SegmentedControl>
      );
    }
    render(<Controlled />);

    await userEvent.click(segment("Day"));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(segment("Day")).toHaveAttribute("aria-pressed", "true");
  });

  it("walks the segments with the arrow keys", async () => {
    render(<Range />);
    await userEvent.tab();

    expect(segment("Day")).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(segment("Week")).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(segment("Day")).toHaveFocus();
  });

  /* Roving tabindex: the group is one tab stop, so a keyboard reader passing by
     steps over it rather than through every segment. */
  it("takes one tab stop for the whole group", async () => {
    render(
      <>
        <Range />
        <button type="button">after</button>
      </>,
    );

    await userEvent.tab();
    expect(segment("Day")).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("refuses interaction when disabled", async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl defaultValue="day" disabled onValueChange={onValueChange} aria-label="R">
        <SegmentedControl.Item value="day">Day</SegmentedControl.Item>
        <SegmentedControl.Item value="week">Week</SegmentedControl.Item>
      </SegmentedControl>,
    );

    await userEvent.click(segment("Week"));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

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
