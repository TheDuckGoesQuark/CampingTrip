import type { Meta, StoryObj } from "@storybook/react-vite";

import { Anchor, Breadcrumbs, NavLink, Pagination, Stack, Stepper, Tabs } from "../primitives";

const meta: Meta = { title: "Showcase/Navigation" };
export default meta;
type Story = StoryObj;

export const TabsStory: Story = {
  name: "Tabs",
  render: () => (
    <Tabs defaultValue="projects" maw={420}>
      <Tabs.List>
        <Tabs.Tab value="projects">Projects</Tabs.Tab>
        <Tabs.Tab value="notes">Notes</Tabs.Tab>
        <Tabs.Tab value="music">Music</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="projects" pt="sm">
        Projects panel
      </Tabs.Panel>
      <Tabs.Panel value="notes" pt="sm">
        Notes panel
      </Tabs.Panel>
      <Tabs.Panel value="music" pt="sm">
        Music panel
      </Tabs.Panel>
    </Tabs>
  ),
};

export const Breadcrumbsy: Story = {
  name: "Breadcrumbs",
  render: () => (
    <Breadcrumbs>
      <Anchor href="#">Home</Anchor>
      <Anchor href="#">Projects</Anchor>
      <Anchor href="#">Camping Trip</Anchor>
    </Breadcrumbs>
  ),
};

export const Paginations: Story = {
  render: () => (
    <Stack>
      <Pagination total={10} defaultValue={3} />
      <Pagination total={10} defaultValue={3} color="amber" size="sm" />
    </Stack>
  ),
};

export const Steppers: Story = {
  render: () => (
    <Stepper active={1} maw={520}>
      <Stepper.Step label="First" description="Pitch tent" />
      <Stepper.Step label="Second" description="Light fire" />
      <Stepper.Step label="Third" description="Coffee" />
    </Stepper>
  ),
};

export const NavLinks: Story = {
  render: () => (
    <Stack maw={260}>
      <NavLink label="Active" active />
      <NavLink label="With description" description="Secondary text" />
      <NavLink label="Amber" active color="amber" />
    </Stack>
  ),
};
