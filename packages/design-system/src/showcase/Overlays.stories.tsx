import { useDisclosure } from "@mantine/hooks";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Button,
  Drawer,
  Group,
  HoverCard,
  Menu,
  Modal,
  Popover,
  Text,
  Tooltip,
} from "../primitives";

const meta: Meta = { title: "Showcase/Overlays" };
export default meta;
type Story = StoryObj;

export const ModalStory: Story = {
  name: "Modal",
  render: () => {
    const [opened, { open, close }] = useDisclosure(false);
    return (
      <>
        <Button onClick={open}>Open modal</Button>
        <Modal opened={opened} onClose={close} title="A themed modal">
          <Text>Modal content, centered and rounded per the theme defaults.</Text>
        </Modal>
      </>
    );
  },
};

export const DrawerStory: Story = {
  name: "Drawer",
  render: () => {
    const [opened, { open, close }] = useDisclosure(false);
    return (
      <>
        <Button onClick={open}>Open drawer</Button>
        <Drawer opened={opened} onClose={close} title="A drawer">
          <Text>Slides in from the side.</Text>
        </Drawer>
      </>
    );
  },
};

export const Popovers: Story = {
  render: () => (
    <Group>
      <Popover width={220} position="bottom" withArrow shadow="md">
        <Popover.Target>
          <Button variant="light">Popover</Button>
        </Popover.Target>
        <Popover.Dropdown>
          <Text size="sm">Free-form floating content.</Text>
        </Popover.Dropdown>
      </Popover>

      <HoverCard width={220} shadow="md">
        <HoverCard.Target>
          <Button variant="subtle">Hover card</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Text size="sm">Appears on hover.</Text>
        </HoverCard.Dropdown>
      </HoverCard>

      <Tooltip label="A tooltip" withArrow>
        <Button variant="outline">Tooltip</Button>
      </Tooltip>

      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Button>Menu</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Application</Menu.Label>
          <Menu.Item>Settings</Menu.Item>
          <Menu.Item>Messages</Menu.Item>
          <Menu.Divider />
          <Menu.Item color="red">Delete</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  ),
};
