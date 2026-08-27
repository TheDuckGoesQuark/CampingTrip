import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tile } from "./Tile";

const meta: Meta<typeof Tile> = {
  title: "Components/Tile",
  component: Tile,
  args: { label: "Camping Trip" },
};
export default meta;
type Story = StoryObj<typeof Tile>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Tile key={size} label={size} size={size} />
      ))}
      <Tile label="CatMap" color="#1a1a1a" size="lg" />
      <Tile label="PhotoBroom" color="#ffb347" size="lg" />
    </div>
  ),
};
