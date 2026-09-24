import type { Meta, StoryObj } from "@storybook/react-vite";

import { SegmentedNav } from "./SegmentedNav";

const meta: Meta<typeof SegmentedNav> = {
  title: "Components/SegmentedNav",
  component: SegmentedNav,
};
export default meta;
type Story = StoryObj<typeof SegmentedNav>;

export const Default: Story = {
  render: () => (
    <SegmentedNav aria-label="Length of this CV">
      <SegmentedNav.Item current>Full</SegmentedNav.Item>
      <SegmentedNav.Item render={<a href="#condensed" />}>Condensed</SegmentedNav.Item>
    </SegmentedNav>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-start" }}>
      <div>
        <code>two segments, the first current</code>
        <div>
          <SegmentedNav aria-label="Length of this CV">
            <SegmentedNav.Item current>Full</SegmentedNav.Item>
            <SegmentedNav.Item render={<a href="#condensed" />}>Condensed</SegmentedNav.Item>
          </SegmentedNav>
        </div>
      </div>
      <div>
        <code>three segments, the last current</code>
        <div>
          <SegmentedNav aria-label="Range">
            <SegmentedNav.Item render={<a href="#day" />}>Day</SegmentedNav.Item>
            <SegmentedNav.Item render={<a href="#week" />}>Week</SegmentedNav.Item>
            <SegmentedNav.Item current>Month</SegmentedNav.Item>
          </SegmentedNav>
        </div>
      </div>
      <div>
        <code>none current, as on a page none of them names</code>
        <div>
          <SegmentedNav aria-label="Views">
            <SegmentedNav.Item render={<a href="#a" />}>A</SegmentedNav.Item>
            <SegmentedNav.Item render={<a href="#b" />}>B</SegmentedNav.Item>
          </SegmentedNav>
        </div>
      </div>
    </div>
  ),
};
