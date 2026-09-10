import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextField } from "./TextField";

const meta: Meta<typeof TextField> = {
  title: "Components/Form/TextField",
  component: TextField,
  args: { label: "Email address", placeholder: "you@example.com" },
};
export default meta;
type Story = StoryObj<typeof TextField>;

const column: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  maxWidth: 380,
};

export const Default: Story = {};

/** Every state a caller can put the control in, at both sizes. */
export const AllVariants: Story = {
  render: () => (
    <div style={column}>
      {(["sm", "md"] as const).map((size) => (
        <TextField key={size} size={size} label={`Rest (${size})`} placeholder="Type here" />
      ))}
      <TextField label="With a hint" description="Only so I can reply." />
      <TextField label="Email address" optional />
      <TextField label="Filled" defaultValue="jordan@example.com" />
      <TextField
        label="Invalid"
        defaultValue="not-an-address"
        error="That address has no @ in it."
      />
      <TextField label="Disabled" defaultValue="held" disabled />
      <TextField
        label="Everything at once"
        description="Only so I can reply."
        optional
        defaultValue="nope"
        error="That address has no @ in it."
      />
    </div>
  ),
};

/** The label is the click target for the control, and the hint is announced with it. */
export const Interactive: Story = {
  args: { label: "Email address", description: "Only so I can reply.", optional: true },
};
