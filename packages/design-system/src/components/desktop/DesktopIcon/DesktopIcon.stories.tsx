import type { Meta, StoryObj } from "@storybook/react-vite";

import { DesktopIcon } from "./DesktopIcon";

const meta: Meta<typeof DesktopIcon> = {
  title: "Desktop/DesktopIcon",
  component: DesktopIcon,
  args: { label: "Camping Trip", color: "#4a9eff" },
};
export default meta;
type Story = StoryObj<typeof DesktopIcon>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24 }}>
      <DesktopIcon label="Camping Trip" color="#4a9eff" isNew />
      <DesktopIcon label="CatMap" color="#1a1a1a" />
      <DesktopIcon label="A very long project name that wraps" color="#ffb347" />
    </div>
  ),
};
