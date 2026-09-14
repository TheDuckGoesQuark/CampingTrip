import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "../../Text";
import { TransferProgress } from "../TransferProgress";
import { LoadingDialog } from "./LoadingDialog";

const meta: Meta<typeof LoadingDialog> = {
  title: "Desktop/LoadingDialog",
  component: LoadingDialog,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: 420, background: "var(--brand-bg)" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof LoadingDialog>;

/** The wait MouseMail shows while a note is in flight. */
export const Default: Story = {
  render: () => (
    <LoadingDialog title="Sending">
      <TransferProgress caption="Transferring… 1 of 1 message" />
    </LoadingDialog>
  ),
};

/** Any wait, not only a transfer. Still no actions: that is the whole point. */
export const PlainWait: Story = {
  render: () => (
    <LoadingDialog title="Working">
      <Text>Tidying 1,204 photos. This will take a minute.</Text>
    </LoadingDialog>
  ),
};

/** Slow enough to watch the parcel step and the blocks fill. */
export const SlowTransfer: Story = {
  render: () => (
    <LoadingDialog title="Sending">
      <TransferProgress caption="Transferring… 1 of 1 message" durationMs={8000} />
    </LoadingDialog>
  ),
};
