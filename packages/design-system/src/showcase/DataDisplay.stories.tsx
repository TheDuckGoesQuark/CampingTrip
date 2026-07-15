import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Accordion,
  Avatar,
  Badge,
  Card,
  Group,
  Indicator,
  Kbd,
  Table,
  Text,
  ThemeIcon,
  Timeline,
  Title,
} from "../primitives";

const meta: Meta = { title: "Showcase/Data display" };
export default meta;
type Story = StoryObj;

export const Badges: Story = {
  render: () => (
    <Group>
      <Badge>Default</Badge>
      <Badge variant="filled">Filled</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="dot">Dot</Badge>
      <Badge color="amber">Amber</Badge>
    </Group>
  ),
};

export const Cards: Story = {
  render: () => (
    <Card maw={320}>
      <Title order={4}>Card title</Title>
      <Text size="sm" c="dimmed" mt="xs">
        Cards default to rounded, subtle-shadow, bordered via the theme.
      </Text>
      <Badge mt="md">tag</Badge>
    </Card>
  ),
};

export const AvatarsAndIcons: Story = {
  render: () => (
    <Group>
      <Avatar name="Jordan Mackie" color="sage" />
      <Avatar name="Smittens" color="amber" />
      <Indicator label="3" size={16} color="amber">
        <Avatar name="JM" />
      </Indicator>
      <ThemeIcon size="lg">★</ThemeIcon>
      <ThemeIcon variant="light" color="amber" size="lg">
        ☾
      </ThemeIcon>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </Group>
  ),
};

export const Tables: Story = {
  render: () => (
    <Table striped highlightOnHover withTableBorder maw={420}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Item</Table.Th>
          <Table.Th>Year</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        <Table.Tr>
          <Table.Td>Camping Trip</Table.Td>
          <Table.Td>2025</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td>PhotoBroom</Table.Td>
          <Table.Td>2026</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  ),
};

export const Timelines: Story = {
  render: () => (
    <Timeline active={1} bulletSize={20} maw={320}>
      <Timeline.Item title="Pitched the tent">
        <Text size="sm" c="dimmed">
          Step one
        </Text>
      </Timeline.Item>
      <Timeline.Item title="Lit the fire">
        <Text size="sm" c="dimmed">
          Step two
        </Text>
      </Timeline.Item>
      <Timeline.Item title="Made coffee" />
    </Timeline>
  ),
};

export const Accordions: Story = {
  render: () => (
    <Accordion maw={420} defaultValue="a">
      <Accordion.Item value="a">
        <Accordion.Control>What is this?</Accordion.Control>
        <Accordion.Panel>A themed accordion.</Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Control>Another</Accordion.Control>
        <Accordion.Panel>More content.</Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  ),
};
