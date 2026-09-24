import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextSurface } from "./TextSurface";

const meta: Meta<typeof TextSurface> = {
  title: "Components/TextSurface",
  component: TextSurface,
  args: { "aria-label": "Message", placeholder: "Anything at all." },
};
export default meta;
type Story = StoryObj<typeof TextSurface>;

/** The control draws no frame, so every story supplies the window it lives in. */
const frame: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 420,
  height: 200,
  border: "2px solid var(--brand-border-strong)",
  background: "var(--brand-surface-raised)",
};

export const Default: Story = {
  render: (args) => (
    <div style={frame}>
      <TextSurface {...args} />
    </div>
  ),
};

const NOTE = `credits.txt

Tent, campfire and picnic models are credited in the
repository's README, one line per author.
`;

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      {(
        [
          ["text", "frame", "A compose body beside other chrome"],
          ["mono", "content", NOTE],
          ["mono", "frame", "A code pane beside other chrome"],
          ["text", "content", "Prose that grows with what is typed"],
        ] as const
      ).map(([face, fill, value]) => (
        <div key={`${face}-${fill}`}>
          <code>{`face="${face}" fill="${fill}"`}</code>
          <div style={frame}>
            <TextSurface
              aria-label={`${face} ${fill}`}
              face={face}
              fill={fill}
              defaultValue={value}
            />
          </div>
        </div>
      ))}
    </div>
  ),
};
