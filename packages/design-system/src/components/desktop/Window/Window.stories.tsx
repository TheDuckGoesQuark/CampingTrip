import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "../../Text";
import { Window } from "./Window";

const meta: Meta<typeof Window> = {
  title: "Desktop/Window",
  component: Window,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: 480, background: "var(--brand-bg)" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Window>;

export const Default: Story = {
  args: {
    title: "Camping Trip",
    children: <Text>A macOS-style window nested inside a desktop takeover.</Text>,
  },
};

export const AllVariants: Story = {
  args: {
    title: "Long content",
    children: (
      <Text>
        {Array.from({ length: 20 }, (_, i) => `Scrollable paragraph ${i + 1}. `).join("")}
      </Text>
    ),
  },
};
