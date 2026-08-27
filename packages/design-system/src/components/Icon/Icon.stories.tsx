import type { Meta, StoryObj } from "@storybook/react-vite";

import { Icon, ICON_NAMES } from "./Icon";

const meta: Meta<typeof Icon> = {
  title: "Components/Icon",
  component: Icon,
  args: { name: "globe" },
};
export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <code>{size}</code>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {ICON_NAMES.map((name) => (
              <span
                key={name}
                title={name}
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <Icon name={name} size={size} />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Glyphs inherit `currentColor`, so a coloured ancestor is all it takes. */
export const InheritsColour: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16 }}>
      {["var(--brand-text)", "var(--brand-solid)", "var(--brand-danger)"].map((color) => (
        <span key={color} style={{ color }}>
          <Icon name="trash" size="lg" />
        </span>
      ))}
    </div>
  ),
};
