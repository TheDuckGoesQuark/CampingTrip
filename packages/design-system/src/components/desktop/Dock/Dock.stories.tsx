import type { Meta, StoryObj } from "@storybook/react-vite";

import { Dock, DockDivider, DockItem } from "./Dock";

const meta: Meta<typeof Dock> = {
  title: "Desktop/Dock",
  component: Dock,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: 160, background: "var(--brand-bg)" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Dock>;

export const Default: Story = {
  render: () => (
    <Dock>
      <DockItem label="Finder">📁</DockItem>
      <DockItem label="Terminal">🖥️</DockItem>
      <DockItem label="Notes">📝</DockItem>
      <DockDivider />
      <DockItem label="Trash">🗑️</DockItem>
    </Dock>
  ),
};

export const AllVariants: Story = { ...Default };
