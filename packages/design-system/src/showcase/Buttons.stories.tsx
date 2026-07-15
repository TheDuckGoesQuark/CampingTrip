import type { Meta, StoryObj } from "@storybook/react-vite";

import { ActionIcon, Button, CloseButton, Group, Stack } from "../primitives";

const meta: Meta = { title: "Showcase/Buttons" };
export default meta;
type Story = StoryObj;

const VARIANTS = ["filled", "light", "outline", "subtle", "default", "white"] as const;
const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

export const Buttons: Story = {
  render: () => (
    <Stack>
      <Group>
        {VARIANTS.map((v) => (
          <Button key={v} variant={v}>
            {v}
          </Button>
        ))}
      </Group>
      <Group>
        {VARIANTS.map((v) => (
          <Button key={v} variant={v} color="amber">
            {v}
          </Button>
        ))}
      </Group>
      <Group align="center">
        {SIZES.map((s) => (
          <Button key={s} size={s}>
            {s}
          </Button>
        ))}
      </Group>
      <Group>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button fullWidth={false} radius="xl">
          Pill
        </Button>
      </Group>
    </Stack>
  ),
};

export const ActionIcons: Story = {
  render: () => (
    <Group>
      {VARIANTS.map((v) => (
        <ActionIcon key={v} variant={v} aria-label={v} size="lg">
          ★
        </ActionIcon>
      ))}
      <CloseButton aria-label="Close" />
    </Group>
  ),
};
