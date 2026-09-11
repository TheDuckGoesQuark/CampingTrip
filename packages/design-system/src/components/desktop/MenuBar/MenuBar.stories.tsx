import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Icon } from "../../Icon";
import { Text } from "../../Text";
import { MenuBar } from "./MenuBar";

const meta: Meta<typeof MenuBar> = {
  title: "Desktop/MenuBar",
  component: MenuBar,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: 240, background: "var(--brand-bg)" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof MenuBar>;

export const Default: Story = {
  args: {
    left: <Text variant="body-sm">🐱 CatOS</Text>,
    right: <Text variant="body-sm">9:41</Text>,
  },
};

export const WithMenu: Story = {
  args: {
    left: (
      <MenuBar.Menu
        ariaLabel="CatOS menu"
        label={
          <>
            <Icon name="cat" size="md" />
            <strong>CatOS</strong>
          </>
        }
      >
        <MenuBar.Item>About CatOS</MenuBar.Item>
        <MenuBar.Separator />
        <MenuBar.Item>Close all windows</MenuBar.Item>
        <MenuBar.Item disabled>Nothing to do</MenuBar.Item>
        <MenuBar.Separator />
        <MenuBar.Item shortcut="Esc">Shut down</MenuBar.Item>
      </MenuBar.Menu>
    ),
    right: <Text variant="body-sm">9:41</Text>,
  },
};

export const WithAction: Story = {
  args: {
    left: <Text variant="body-sm">CatOS</Text>,
    right: (
      <>
        <MenuBar.Action ariaLabel="Touch grass" title="Touch grass">
          <Icon name="door-arrow" size="md" />
        </MenuBar.Action>
        <Text variant="body-sm">9:41</Text>
      </>
    ),
  },
};

export const WithPanel: Story = {
  args: {
    left: <Text variant="body-sm">CatOS</Text>,
    right: (
      <>
        <MenuBar.Panel ariaLabel="Volume" label={<Icon name="cassette" size="md" />}>
          <label>
            <Text variant="label" as="span">
              Volume
            </Text>
            <input type="range" defaultValue={70} />
          </label>
        </MenuBar.Panel>
        <Text variant="body-sm">9:41</Text>
      </>
    ),
  },
};

export const Interactive: Story = {
  ...WithPanel,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("open", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Volume" }));
      await waitFor(() => expect(document.querySelector("[role=slider]")).toBeTruthy());
    });
    await step("the slider keeps its own arrow keys", async () => {
      const slider = document.querySelector("[role=slider]") as HTMLInputElement;
      slider.focus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(Number(slider.value)).toBeGreaterThan(70));
    });
    await step("Escape closes and returns focus to the trigger", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(canvas.getByRole("button", { name: "Volume" })).toHaveFocus());
    });
  },
};

export const AllVariants: Story = {
  args: {
    left: WithMenu.args?.left,
    right: (
      <>
        <MenuBar.Action ariaLabel="Touch grass" title="Touch grass">
          <Icon name="door-arrow" size="md" />
        </MenuBar.Action>
        {WithPanel.args?.right}
      </>
    ),
  },
};
