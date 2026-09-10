import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextArea } from "./TextArea";

const meta: Meta<typeof TextArea> = {
  title: "Components/Form/TextArea",
  component: TextArea,
  args: { label: "Message", placeholder: "Say anything." },
};
export default meta;
type Story = StoryObj<typeof TextArea>;

const column: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  maxWidth: 380,
};

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div style={column}>
      {(["sm", "md"] as const).map((size) => (
        <TextArea key={size} size={size} label={`Rest (${size})`} placeholder="Type here" />
      ))}
      <TextArea label="With a hint" description="However much or little you like." />
      <TextArea label="Message" optional />
      <TextArea label="Two rows" rows={2} />
      <TextArea label="Invalid" error="Say something first." />
      <TextArea label="Disabled" defaultValue="held" disabled />
    </div>
  ),
};
