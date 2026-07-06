import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Alert,
  Group,
  Loader,
  Notification,
  Progress,
  RingProgress,
  Skeleton,
  Stack,
  Text,
} from "../primitives";

const meta: Meta = { title: "Showcase/Feedback" };
export default meta;
type Story = StoryObj;

export const Alerts: Story = {
  render: () => (
    <Stack maw={420}>
      <Alert title="Heads up">A default sage alert.</Alert>
      <Alert title="Warm" color="amber" variant="light">
        An amber, light-variant alert.
      </Alert>
      <Alert title="Filled" variant="filled">
        A filled alert.
      </Alert>
    </Stack>
  ),
};

export const Loaders: Story = {
  render: () => (
    <Group>
      <Loader type="oval" />
      <Loader type="dots" />
      <Loader type="bars" />
      <Loader color="amber" />
    </Group>
  ),
};

export const Progures: Story = {
  render: () => (
    <Stack maw={360}>
      <Progress value={30} />
      <Progress value={60} color="amber" />
      <Progress.Root size="xl">
        <Progress.Section value={40}>
          <Progress.Label>40%</Progress.Label>
        </Progress.Section>
      </Progress.Root>
      <RingProgress
        sections={[{ value: 65, color: "sage" }]}
        label={<Text ta="center">65%</Text>}
      />
    </Stack>
  ),
};

export const Skeletons: Story = {
  render: () => (
    <Stack maw={360}>
      <Skeleton height={12} radius="xl" />
      <Skeleton height={12} width="70%" radius="xl" />
      <Skeleton height={48} circle />
    </Stack>
  ),
};

export const Notifications: Story = {
  render: () => (
    <Stack maw={420}>
      <Notification title="Saved">Your changes were saved.</Notification>
      <Notification title="Error" color="red" withCloseButton={false}>
        Something went wrong.
      </Notification>
    </Stack>
  ),
};
