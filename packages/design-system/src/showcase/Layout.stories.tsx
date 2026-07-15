import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Box,
  Card,
  Center,
  Divider,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from "../primitives";

const meta: Meta = { title: "Showcase/Layout" };
export default meta;
type Story = StoryObj;

const Block = ({ children }: { children: React.ReactNode }) => (
  <Paper withBorder p="sm" bg="sage.0">
    <Text ta="center" size="sm">
      {children}
    </Text>
  </Paper>
);

export const PaperAndCard: Story = {
  render: () => (
    <Group align="stretch">
      <Paper withBorder p="md" maw={200}>
        <Text>Paper (rounded)</Text>
      </Paper>
      <Card maw={200}>
        <Text>Card (border + shadow)</Text>
      </Card>
    </Group>
  ),
};

export const Stacks: Story = {
  render: () => (
    <Stack maw={280}>
      <Block>Stack item 1</Block>
      <Block>Stack item 2</Block>
      <Block>Stack item 3</Block>
    </Stack>
  ),
};

export const Groups: Story = {
  render: () => (
    <Group>
      <Block>A</Block>
      <Block>B</Block>
      <Block>C</Block>
    </Group>
  ),
};

export const Grids: Story = {
  render: () => (
    <Grid maw={480}>
      <Grid.Col span={6}>
        <Block>span 6</Block>
      </Grid.Col>
      <Grid.Col span={6}>
        <Block>span 6</Block>
      </Grid.Col>
      <Grid.Col span={4}>
        <Block>4</Block>
      </Grid.Col>
      <Grid.Col span={8}>
        <Block>8</Block>
      </Grid.Col>
    </Grid>
  ),
};

export const SimpleGrids: Story = {
  render: () => (
    <SimpleGrid cols={3} maw={480}>
      {Array.from({ length: 6 }, (_, i) => (
        <Block key={i}>{i + 1}</Block>
      ))}
    </SimpleGrid>
  ),
};

export const Dividers: Story = {
  render: () => (
    <Stack maw={320}>
      <Text>Above</Text>
      <Divider />
      <Text>Between</Text>
      <Divider label="labelled" labelPosition="center" />
      <Text>Below</Text>
      <Center h={60}>
        <Box>Centered box</Box>
      </Center>
    </Stack>
  ),
};
