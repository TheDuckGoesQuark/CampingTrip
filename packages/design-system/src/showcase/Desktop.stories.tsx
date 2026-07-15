import { useDisclosure } from "@mantine/hooks";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { DesktopIcon, Dock, DockDivider, DockItem, MenuBar, Window } from "../desktop";
import { Box, Button, Group, Text, Title } from "../primitives";

const meta: Meta = { title: "Showcase/Desktop" };
export default meta;
type Story = StoryObj;

/** A positioned canvas so the absolutely-placed chrome has something to sit in. */
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <Box
      style={{
        position: "relative",
        height: 460,
        borderRadius: 12,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, var(--mantine-color-body), var(--mantine-color-default))",
      }}
    >
      {children}
    </Box>
  );
}

export const FullDesktop: Story = {
  name: "Full desktop",
  render: () => (
    <Screen>
      <MenuBar
        left={
          <Group gap={20}>
            <Text fw={700} size="sm">
              🐱 CatOS
            </Text>
            <Text size="sm" c="dimmed">
              Finder
            </Text>
          </Group>
        }
        right={
          <Text size="sm" c="dimmed">
            9:41
          </Text>
        }
      />

      <Group justify="center" gap={24} pt={64}>
        <DesktopIcon label="Camping Trip" color="#4a9eff" isNew />
        <DesktopIcon label="CatMap" color="#1a1a1a" />
        <DesktopIcon label="PhotoBroom" color="#ffb347" />
      </Group>

      <Dock>
        <DockItem label="Finder">📁</DockItem>
        <DockItem label="Terminal">🖥️</DockItem>
        <DockItem label="Notes">📝</DockItem>
        <DockDivider />
        <DockItem label="Trash">🗑️</DockItem>
      </Dock>
    </Screen>
  ),
};

export const WindowStory: Story = {
  name: "Window",
  render: () => {
    const [opened, { open, close }] = useDisclosure(true);
    return (
      <Screen>
        <Group justify="center" pt={40}>
          <Button onClick={open}>Open window</Button>
        </Group>
        {opened && (
          <Window title="Camping Trip" onClose={close}>
            <Title order={3}>Camping Trip</Title>
            <Text size="sm" c="dimmed" mb="md">
              2025
            </Text>
            <Text>
              A floating desktop window with macOS traffic lights. Click the red light or the
              backdrop to close.
            </Text>
          </Window>
        )}
      </Screen>
    );
  },
};
