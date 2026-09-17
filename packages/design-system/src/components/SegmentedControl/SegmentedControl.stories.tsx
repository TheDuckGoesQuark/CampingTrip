import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { SegmentedControl } from "./SegmentedControl";
import { SegmentedNav } from "./SegmentedNav";

const meta: Meta<typeof SegmentedControl> = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
};
export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Default: Story = {
  render: () => (
    <SegmentedControl defaultValue="week" aria-label="Range">
      <SegmentedControl.Item value="day">Day</SegmentedControl.Item>
      <SegmentedControl.Item value="week">Week</SegmentedControl.Item>
      <SegmentedControl.Item value="month">Month</SegmentedControl.Item>
    </SegmentedControl>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-start" }}>
      <SegmentedControl defaultValue="light" aria-label="Theme">
        <SegmentedControl.Item value="light">Light</SegmentedControl.Item>
        <SegmentedControl.Item value="dark">Dark</SegmentedControl.Item>
      </SegmentedControl>

      <SegmentedControl defaultValue="day" disabled aria-label="Range, unavailable">
        <SegmentedControl.Item value="day">Day</SegmentedControl.Item>
        <SegmentedControl.Item value="week">Week</SegmentedControl.Item>
      </SegmentedControl>

      <SegmentedNav aria-label="Length of this CV">
        <SegmentedNav.Item current>Full</SegmentedNav.Item>
        <SegmentedNav.Item render={<a href="#condensed" />}>Condensed</SegmentedNav.Item>
      </SegmentedNav>
    </div>
  ),
};

/** Proves the group moves its choice, and that arrow keys walk the segments. */
export const Interactive: Story = {
  render: function Controlled() {
    const [range, setRange] = useState("day");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SegmentedControl value={range} onValueChange={setRange} aria-label="Range">
          <SegmentedControl.Item value="day">Day</SegmentedControl.Item>
          <SegmentedControl.Item value="week">Week</SegmentedControl.Item>
          <SegmentedControl.Item value="month">Month</SegmentedControl.Item>
        </SegmentedControl>
        <output data-testid="chosen">{range}</output>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Month" }));
    await expect(canvas.getByTestId("chosen")).toHaveTextContent("month");

    // Pressing the chosen segment again must not leave the control on nothing.
    await userEvent.click(canvas.getByRole("button", { name: "Month" }));
    await expect(canvas.getByTestId("chosen")).toHaveTextContent("month");

    await userEvent.keyboard("{ArrowLeft}{Enter}");
    await expect(canvas.getByTestId("chosen")).toHaveTextContent("week");
  },
};
