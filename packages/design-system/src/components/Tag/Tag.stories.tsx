import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tag } from "./Tag";

const meta: Meta<typeof Tag> = {
  title: "Components/Tag",
  component: Tag,
  args: { children: "music" },
};
export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Tag>plain</Tag>
        <Tag selected>selected</Tag>
        <Tag count={6}>with a count</Tag>
        <Tag selected count={3}>
          selected, counted
        </Tag>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Tag render={<a href="#tag" />}>a link</Tag>
        <Tag selected render={<a href="#tag" />}>
          a selected link
        </Tag>
      </div>
    </div>
  ),
};

/** A rail: every tag navigable except the one standing for the current page. */
export const Rail: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 420 }}>
      <Tag count={14} render={<a href="#all" />}>
        All
      </Tag>
      <Tag count={6} render={<a href="#code" />}>
        code
      </Tag>
      <Tag selected count={3} aria-current="page">
        music
      </Tag>
      <Tag count={4} render={<a href="#making" />}>
        making
      </Tag>
      <Tag count={2} render={<a href="#games" />}>
        games
      </Tag>
    </div>
  ),
};
