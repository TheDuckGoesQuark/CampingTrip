import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "../../Text";
import { MenuBar } from "./MenuBar";

const meta: Meta<typeof MenuBar> = {
  title: "Desktop/MenuBar",
  component: MenuBar,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: 120, background: "var(--brand-bg)" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof MenuBar>;

export const Default: Story = {
  args: {
    left: <Text variant="body-sm">🐱 CatOS</Text>,
    right: <Text variant="body-sm">9:41</Text>,
  },
};

export const AllVariants: Story = { ...Default };
