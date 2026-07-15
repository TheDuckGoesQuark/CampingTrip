import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  args: { children: "New" },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

const TONES = ["neutral", "brand", "accent", "danger"] as const;

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {(["light", "solid"] as const).map((variant) => (
        <div key={variant} style={{ display: "flex", gap: 8 }}>
          {TONES.map((tone) => (
            <Badge key={tone} variant={variant} tone={tone}>
              {variant} {tone}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};
