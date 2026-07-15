import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  args: { children: "Set up camp" },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {(["solid", "subtle", "ghost", "default"] as const).map((variant) => (
        <div key={variant} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Button variant={variant} size="sm">
            {variant} sm
          </Button>
          <Button variant={variant} size="md">
            {variant} md
          </Button>
          <Button variant={variant} disabled>
            disabled
          </Button>
        </div>
      ))}
    </div>
  ),
};
