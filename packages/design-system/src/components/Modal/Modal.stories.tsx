import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "../Button";
import { Text } from "../Text";
import { Modal } from "./Modal";

const meta: Meta<typeof Modal> = { title: "Components/Modal", component: Modal };
export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => (
    <Modal>
      <Modal.Trigger render={<Button>Open modal</Button>} />
      <Modal.Header>
        <Modal.Title>
          <Text variant="title-4">Get in touch</Text>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Text>A themed dialog on Base UI — focus trapped, Escape to close, focus returns.</Text>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Close render={<Button variant="ghost">Cancel</Button>} />
        <Modal.Close render={<Button>Confirm</Button>} />
      </Modal.Footer>
    </Modal>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12 }}>
      <Modal size="sm">
        <Modal.Trigger render={<Button variant="subtle">Small</Button>} />
        <Modal.Header>
          <Modal.Title>
            <Text variant="title-4">Small</Text>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Text>Small centered modal.</Text>
        </Modal.Body>
      </Modal>
      <Modal variant="takeover">
        <Modal.Trigger render={<Button variant="subtle">Takeover</Button>} />
        <Modal.Header>
          <Modal.Title>
            <Text variant="title-3">Full-screen takeover</Text>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Text>The CatOS blog uses this variant.</Text>
        </Modal.Body>
      </Modal>
    </div>
  ),
};

export const Interactive: Story = {
  ...Default,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("open", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Open modal" }));
      await waitFor(() => expect(document.querySelector("[role=dialog]")).toBeTruthy());
    });
    await step("focus is inside the dialog", async () => {
      const dialog = document.querySelector("[role=dialog]") as HTMLElement;
      await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    });
    await step("Escape closes and returns focus to the trigger", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(canvas.getByRole("button", { name: "Open modal" })).toHaveFocus());
    });
  },
};
