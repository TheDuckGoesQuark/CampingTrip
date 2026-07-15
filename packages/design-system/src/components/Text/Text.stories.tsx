import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "./Text";

const meta: Meta<typeof Text> = {
  title: "Components/Text",
  component: Text,
  args: { children: "The campfire crackles softly." },
};
export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {};

const VARIANTS = [
  "title-1",
  "title-2",
  "title-3",
  "title-4",
  "body-lg",
  "body",
  "body-sm",
  "label",
] as const;

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {VARIANTS.map((variant) => (
        <Text key={variant} variant={variant}>
          {variant}
        </Text>
      ))}
      <Text tone="muted">muted body</Text>
      <Text tone="link">link body</Text>
    </div>
  ),
};
