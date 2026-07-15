import type { Meta, StoryObj } from "@storybook/react-vite";

import { Link } from "./Link";

const meta: Meta<typeof Link> = {
  title: "Components/Link",
  component: Link,
  args: { children: "Visit the campsite", href: "#" },
};
export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <p>
      A paragraph with an <Link href="#">inline link</Link> in the middle of the sentence.
    </p>
  ),
};
