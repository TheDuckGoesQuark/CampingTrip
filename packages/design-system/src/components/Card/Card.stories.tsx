import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "../Text";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  args: { children: "A boxy bordered surface." },
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {};

const TONES = ["surface", "sunken", "subtle"] as const;
const ELEVATIONS = ["flat", "raised", "floating"] as const;

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 640 }}>
      {ELEVATIONS.map((elevation) => (
        <div key={elevation} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <code>{elevation}</code>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {TONES.map((tone) => (
              <Card key={tone} tone={tone} elevation={elevation}>
                <Text variant="body-sm">{tone}</Text>
              </Card>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <code>padding</code>
        <div style={{ display: "flex", gap: 16 }}>
          <Card padding="sm">
            <Text variant="body-sm">sm</Text>
          </Card>
          <Card padding="md">
            <Text variant="body-sm">md</Text>
          </Card>
        </div>
      </div>
    </div>
  ),
};

/**
 * Given `render`, the whole card becomes one control and picks up hover and
 * focus affordances on its own.
 */
export const AsALink: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16, maxWidth: 640 }}>
      {TONES.map((tone) => (
        <Card key={tone} tone={tone} render={<a href="#card" />}>
          <Text variant="title-4">Hover me</Text>
          <Text variant="body-sm" tone="muted">
            tone={tone}
          </Text>
        </Card>
      ))}
    </div>
  ),
};
