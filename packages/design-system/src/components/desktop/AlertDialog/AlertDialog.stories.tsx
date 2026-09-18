import { CheckCircle, Info, WarningCircle } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import { Button } from "../../Button";
import { CopyButton } from "../../CopyButton";
import { Text } from "../../Text";
import { AlertDialog } from "./AlertDialog";

const meta: Meta<typeof AlertDialog> = {
  title: "Desktop/AlertDialog",
  component: AlertDialog,
  parameters: { layout: "fullscreen" },
  // The scrim needs this, or it covers Storybook's own chrome.
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: 420, background: "var(--brand-bg)" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof AlertDialog>;

const MARK_PX = 28;

/** Title, body and one way out — no icon. */
export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialog.Title>Bin emptied</AlertDialog.Title>
      <AlertDialog.Body>
        <Text>All 47 items are gone for good.</Text>
      </AlertDialog.Body>
      <AlertDialog.Actions>
        <Button variant="default" size="sm">
          OK
        </Button>
      </AlertDialog.Actions>
    </AlertDialog>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialog.Title>Message sent</AlertDialog.Title>
      <AlertDialog.Icon>
        <CheckCircle size={MARK_PX} weight="fill" />
      </AlertDialog.Icon>
      <AlertDialog.Body>
        <Text>Thanks for your message, I&apos;ll usually reply within a few days!</Text>
      </AlertDialog.Body>
      <AlertDialog.Actions>
        <Button variant="default" size="sm">
          OK
        </Button>
      </AlertDialog.Actions>
    </AlertDialog>
  ),
};

export const Failure: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialog.Title>Not sent</AlertDialog.Title>
      <AlertDialog.Icon>
        <WarningCircle size={MARK_PX} weight="fill" />
      </AlertDialog.Icon>
      <AlertDialog.Body>
        <Text>The mailbox was handling too much at once. Worth trying again in a moment.</Text>
      </AlertDialog.Body>
      <AlertDialog.Actions>
        <Button variant="default" size="sm">
          Back
        </Button>
        <CopyButton value="To: someone@example.com" label="Copy email contents" size="sm" />
      </AlertDialog.Actions>
    </AlertDialog>
  ),
};

/** Slots given out of order, and no Actions — nothing to do but read it. */
export const NoActions: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialog.Body>
        <Text>Saving happens on its own. There is nothing to press.</Text>
      </AlertDialog.Body>
      <AlertDialog.Icon>
        <Info size={MARK_PX} weight="fill" />
      </AlertDialog.Icon>
      <AlertDialog.Title>For your information</AlertDialog.Title>
    </AlertDialog>
  ),
};

/* The scrim is absolute, so each cell needs its own containing block — one on
   the grid instead would stack every dialog on top of the others. */
function Cell({ children }: { children: ReactNode }) {
  return <div style={{ position: "relative", minHeight: 260 }}>{children}</div>;
}

const OUTCOMES: { key: string; title: string; mark: ReactNode; line: string }[] = [
  {
    key: "sent",
    title: "Message sent",
    mark: <CheckCircle size={MARK_PX} weight="fill" />,
    line: "Thanks for your message, I'll usually reply within a few days!",
  },
  {
    key: "failed",
    title: "Not sent",
    mark: <WarningCircle size={MARK_PX} weight="fill" />,
    line: "The mailbox was handling too much at once.",
  },
  {
    key: "done",
    title: "Bin emptied",
    mark: <Info size={MARK_PX} weight="fill" />,
    line: "All 47 items are gone for good.",
  },
];

export const AllVariants: Story = {
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ background: "var(--brand-bg)", padding: 16 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 16,
      }}
    >
      {OUTCOMES.map(({ key, title, mark, line }) => (
        <Cell key={key}>
          <AlertDialog>
            <AlertDialog.Title>{title}</AlertDialog.Title>
            <AlertDialog.Icon>{mark}</AlertDialog.Icon>
            <AlertDialog.Body>
              <Text>{line}</Text>
            </AlertDialog.Body>
            <AlertDialog.Actions>
              <Button variant="default" size="sm">
                OK
              </Button>
            </AlertDialog.Actions>
          </AlertDialog>
        </Cell>
      ))}

      <Cell>
        <AlertDialog>
          <AlertDialog.Title>No icon, no tone</AlertDialog.Title>
          <AlertDialog.Body>
            <Text>The title and the body carry it on their own.</Text>
          </AlertDialog.Body>
          <AlertDialog.Actions>
            <Button variant="default" size="sm">
              OK
            </Button>
          </AlertDialog.Actions>
        </AlertDialog>
      </Cell>

      <Cell>
        <AlertDialog>
          <AlertDialog.Title>Not sent</AlertDialog.Title>
          <AlertDialog.Icon>
            <WarningCircle size={MARK_PX} weight="fill" />
          </AlertDialog.Icon>
          <AlertDialog.Body>
            <Text>Nothing came back at all. Worth a look at your connection.</Text>
          </AlertDialog.Body>
          <AlertDialog.Actions>
            <Button variant="default" size="sm">
              Back
            </Button>
            <CopyButton value="To: someone@example.com" label="Copy email contents" size="sm" />
          </AlertDialog.Actions>
        </AlertDialog>
      </Cell>

      <Cell>
        <AlertDialog>
          <AlertDialog.Title>Nothing to press</AlertDialog.Title>
          <AlertDialog.Icon>
            <Info size={MARK_PX} weight="fill" />
          </AlertDialog.Icon>
          <AlertDialog.Body>
            <Text>Saving happens on its own.</Text>
          </AlertDialog.Body>
        </AlertDialog>
      </Cell>
    </div>
  ),
};
