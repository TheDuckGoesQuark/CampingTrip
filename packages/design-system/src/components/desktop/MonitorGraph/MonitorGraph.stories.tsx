import type { Meta, StoryObj } from "@storybook/react-vite";

import { MonitorGraph } from "./MonitorGraph";

const meta: Meta<typeof MonitorGraph> = {
  title: "Desktop/MonitorGraph",
  component: MonitorGraph,
  args: {
    label: "Visitors over the last 14 days, one bar per day",
    values: [3, 5, 2, 8, 6, 9, 4, 7, 12, 10, 6, 5, 9, 11],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof MonitorGraph>;

export const Default: Story = {};

/** Fewer values than slots: the graph fills from the right, as a monitor does. */
export const FillingUp: Story = { args: { values: [2, 4, 3], slots: 14 } };

const LINE = {
  label: "Memory in use, sampled each second",
  kind: "line" as const,
  values: [256, 256, 384, 384, 384, 512, 512, 384, 384, 640, 640, 640],
  slots: 30,
  max: 1024,
};

export const Line: Story = { args: LINE };

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 16 }}>
      <MonitorGraph {...args} />
      <MonitorGraph {...LINE} />
    </div>
  ),
};
