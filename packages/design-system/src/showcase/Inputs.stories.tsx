import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Autocomplete,
  Checkbox,
  Chip,
  Fieldset,
  Group,
  MultiSelect,
  NativeSelect,
  NumberInput,
  PasswordInput,
  Radio,
  Rating,
  SegmentedControl,
  Select,
  Slider,
  Stack,
  Switch,
  Textarea,
  TextInput,
} from "../primitives";

const meta: Meta = { title: "Showcase/Inputs" };
export default meta;
type Story = StoryObj;

const OPTS = ["Tent", "Campfire", "Guitar", "Moka pot"];

export const TextInputs: Story = {
  render: () => (
    <Stack maw={320}>
      <TextInput label="Text input" placeholder="Your name" description="A short label" />
      <TextInput label="With error" placeholder="oops" error="Something's off" />
      <PasswordInput label="Password" placeholder="••••••" />
      <NumberInput label="Number" defaultValue={3} />
      <Textarea label="Textarea" placeholder="Say something…" autosize minRows={2} />
    </Stack>
  ),
};

export const Selects: Story = {
  render: () => (
    <Stack maw={320}>
      <Select label="Select" data={OPTS} defaultValue="Tent" />
      <MultiSelect label="Multi-select" data={OPTS} defaultValue={["Tent", "Guitar"]} />
      <Autocomplete label="Autocomplete" data={OPTS} placeholder="Type…" />
      <NativeSelect label="Native select" data={OPTS} />
    </Stack>
  ),
};

export const Checkboxes: Story = {
  render: () => (
    <Group align="flex-start" gap="xl">
      <Stack>
        <Checkbox label="Checkbox" defaultChecked />
        <Checkbox label="Unchecked" />
        <Checkbox label="Indeterminate" indeterminate />
      </Stack>
      <Radio.Group defaultValue="a" label="Radio group">
        <Stack mt="xs">
          <Radio value="a" label="Option A" />
          <Radio value="b" label="Option B" />
        </Stack>
      </Radio.Group>
      <Stack>
        <Switch label="Switch off" />
        <Switch label="Switch on" defaultChecked />
        <Switch label="Amber" color="amber" defaultChecked />
      </Stack>
    </Group>
  ),
};

export const Controls: Story = {
  render: () => (
    <Stack maw={360}>
      <SegmentedControl data={["Day", "Week", "Month"]} />
      <Slider defaultValue={40} marks={[{ value: 25 }, { value: 50 }, { value: 75 }]} />
      <Group>
        <Chip defaultChecked>Chip</Chip>
        <Chip color="amber">Amber chip</Chip>
      </Group>
      <Rating defaultValue={3} />
      <Fieldset legend="Grouped inputs">
        <TextInput label="Name" placeholder="…" />
      </Fieldset>
    </Stack>
  ),
};
