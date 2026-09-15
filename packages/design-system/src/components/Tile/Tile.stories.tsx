import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tile } from "./Tile";

/** A stand-in image: two triangles, so the cover-fit is visible. */
const SWATCH =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10z" fill="#ff7a3d"/><path d="M0 0v10h10z" fill="#ffd166"/></svg>';

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

export const Faces: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
      <Tile
        label="Smittens"
        color="#1a1a1a"
        size="md"
        icon={`data:image/svg+xml,${encodeURIComponent(SWATCH)}`}
      />
      <Tile label="Music Production" color="#8a5cf6" size="md" glyph="note" />
      <Tile label="PhotoBroom" color="#ffb347" size="md" />
    </div>
  ),
};
