import type { Meta, StoryObj } from "@storybook/react-vite";

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

export const AllVariants: Story = { ...WithMenu };
