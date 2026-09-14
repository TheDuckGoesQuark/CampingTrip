import type { Meta, StoryObj } from "@storybook/react-vite";

import { CopyButton } from "./CopyButton";

const meta: Meta<typeof CopyButton> = {
  title: "CopyButton",
  component: CopyButton,
  args: { value: "To: someone@example.com\n\nthe tent will not load\n" },
};
export default meta;
type Story = StoryObj<typeof CopyButton>;

export const Default: Story = {};

export const LongLabel: Story = {
  args: { label: "Copy email contents", size: "sm" },
};

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      {(["solid", "subtle", "ghost", "default"] as const).map((variant) => (
        <CopyButton
          key={variant}
          {...args}
          variant={variant}
          size="sm"
          label="Copy email contents"
        />
      ))}
    </div>
  ),
};
