import type { Meta, StoryObj } from "@storybook/react-vite";

import { TransferProgress } from "./TransferProgress";

const meta: Meta<typeof TransferProgress> = {
  title: "Desktop/TransferProgress",
  component: TransferProgress,
  args: { caption: "Transferring… 1 of 1 message" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof TransferProgress>;

export const Default: Story = {};

export const Endpoints: Story = {
  args: { from: "Camera", to: "This PC", caption: "Copying… 84 of 1,204 photos" },
};

/** Slow enough to watch the parcel step and the blocks uncover. */
export const Slow: Story = { args: { durationMs: 8000 } };
