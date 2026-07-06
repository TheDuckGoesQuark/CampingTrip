import type { Meta, StoryObj } from "@storybook/react-vite";

import { Group, Paper, Stack, Text, Title, useMantineTheme } from "../primitives";

const meta: Meta = { title: "Foundations" };
export default meta;
type Story = StoryObj;

function Swatches({ name }: { name: string }) {
  const theme = useMantineTheme();
  const shades = theme.colors[name];
  return (
    <div>
      <Text size="sm" fw={700} mb={4}>
        {name}
      </Text>
      <Group gap={0} wrap="nowrap">
        {shades.map((c, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 44, background: c }} />
            <Text size="9px" ff="monospace">
              {i}
            </Text>
          </div>
        ))}
      </Group>
    </div>
  );
}

export const Colors: Story = {
  render: () => (
    <Stack maw={640}>
      <Title order={3}>Palette</Title>
      <Swatches name="sage" />
      <Swatches name="amber" />
      <Text size="sm" c="dimmed">
        Primary = sage, shade 6 (light). Amber is the accent.
      </Text>
    </Stack>
  ),
};

export const Radius: Story = {
  render: () => {
    const theme = useMantineTheme();
    return (
      <Group>
        {Object.entries(theme.radius).map(([k, v]) => (
          <Stack key={k} align="center" gap={4}>
            <div
              style={{
                width: 72,
                height: 72,
                background: "var(--mantine-color-sage-2)",
                borderRadius: v,
              }}
            />
            <Text size="xs">
              {k} ({v})
            </Text>
          </Stack>
        ))}
      </Group>
    );
  },
};

export const Shadows: Story = {
  render: () => {
    const theme = useMantineTheme();
    return (
      <Group p="md">
        {Object.keys(theme.shadows).map((k) => (
          <Stack key={k} align="center" gap={8}>
            <Paper w={90} h={72} withBorder={false} shadow={k as string} />
            <Text size="xs">{k}</Text>
          </Stack>
        ))}
      </Group>
    );
  },
};

export const Type: Story = {
  render: () => {
    const theme = useMantineTheme();
    return (
      <Stack>
        {Object.entries(theme.fontSizes).map(([k, v]) => (
          <Text key={k} style={{ fontSize: v }}>
            {k} — The quick brown fox ({v})
          </Text>
        ))}
      </Stack>
    );
  },
};

export const Spacing: Story = {
  render: () => {
    const theme = useMantineTheme();
    return (
      <Stack>
        {Object.entries(theme.spacing).map(([k, v]) => (
          <Group key={k} gap="sm" align="center">
            <Text size="xs" w={24}>
              {k}
            </Text>
            <div style={{ height: 16, width: v, background: "var(--mantine-color-sage-4)" }} />
            <Text size="xs" c="dimmed">
              {v}
            </Text>
          </Group>
        ))}
      </Stack>
    );
  },
};
