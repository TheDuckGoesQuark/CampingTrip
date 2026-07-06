import type { Meta, StoryObj } from "@storybook/react-vite";

import { Anchor, Blockquote, Code, Highlight, List, Mark, Stack, Text, Title } from "../primitives";

const meta: Meta = { title: "Showcase/Typography" };
export default meta;
type Story = StoryObj;

export const Titles: Story = {
  render: () => (
    <Stack>
      <Title order={1}>Heading 1 — Nunito 800</Title>
      <Title order={2}>Heading 2</Title>
      <Title order={3}>Heading 3</Title>
      <Title order={4}>Heading 4</Title>
    </Stack>
  ),
};

export const Texts: Story = {
  render: () => (
    <Stack maw={520}>
      <Text size="xl">Extra-large body text.</Text>
      <Text>Default body text in Nunito.</Text>
      <Text size="sm" c="dimmed">
        Small dimmed text.
      </Text>
      <Text fw={700} c="sage">
        Bold sage text.
      </Text>
      <Text>
        Inline <Code>code</Code>, a <Mark>highlighted</Mark> word, and an{" "}
        <Anchor href="#">anchor link</Anchor>.
      </Text>
      <Highlight highlight="campfire">The campfire crackled all night.</Highlight>
    </Stack>
  ),
};

export const Blocks: Story = {
  render: () => (
    <Stack maw={520}>
      <Blockquote cite="— Jordan">Building small, complete things is its own reward.</Blockquote>
      <List>
        <List.Item>Pitch the tent</List.Item>
        <List.Item>Light the fire</List.Item>
        <List.Item>Make coffee</List.Item>
      </List>
    </Stack>
  ),
};
