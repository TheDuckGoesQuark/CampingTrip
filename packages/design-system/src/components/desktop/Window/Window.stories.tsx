import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Text } from "../../Text";
import { Window } from "./Window";

const meta: Meta<typeof Window> = {
  title: "Desktop/Window",
  component: Window,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: 560, background: "var(--brand-bg)" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Window>;

const lorem = Array.from({ length: 20 }, (_, i) => `Scrollable paragraph ${i + 1}. `).join("");

/** Bare frame — a title bar and a page, no browser chrome. */
export const Default: Story = {
  render: () => (
    <Window>
      <Window.TitleBar title="Camping Trip" onClose={() => {}} />
      <Window.Body>
        <Text>A boxy desktop window floating over the desktop.</Text>
      </Window.Body>
    </Window>
  ),
};

/** Every subpart at once: lights, tab strip, address bar, scrolling page. */
export const AllVariants: Story = {
  render: () => (
    <Window>
      <Window.TitleBar
        title="PhotoBroom — CatNav"
        onClose={() => {}}
        onMinimise={() => {}}
        onMaximise={() => {}}
      />
      <Window.Tabs>
        <Window.Tab label="PhotoBroom" icon="🧹" active onSelect={() => {}} onClose={() => {}} />
        <Window.Tab label="CatMap" icon="🗺️" onSelect={() => {}} onClose={() => {}} />
        <Window.Tab
          label="A tab with a very long title indeed"
          icon="📄"
          onSelect={() => {}}
          onClose={() => {}}
        />
        <Window.NewTab onClick={() => {}} />
      </Window.Tabs>
      <Window.AddressBar
        url="https://jordanscamp.site/blog/photobroom"
        onBack={() => {}}
        onReload={() => {}}
      />
      <Window.Body>
        <Text>{lorem}</Text>
      </Window.Body>
    </Window>
  ),
};

/** Inert chrome — a handler-less light or arrow renders unfocusable/disabled. */
export const InertControls: Story = {
  render: () => (
    <Window>
      <Window.TitleBar title="Read-only chrome" />
      <Window.AddressBar url="https://jordanscamp.site/blog" />
      <Window.Body>
        <Text>
          The traffic lights render as decoration and the arrows as disabled, so nothing announces
          itself as a control that does nothing.
        </Text>
      </Window.Body>
    </Window>
  ),
};

/** Switching tabs and closing them, to prove the strip wiring. */
export const Interactive: Story = {
  render: function Render() {
    const [tabs, setTabs] = useState(["PhotoBroom", "CatMap", "Camping Trip"]);
    const [active, setActive] = useState("PhotoBroom");
    return (
      <Window>
        <Window.TitleBar title={`${active} — CatNav`} onClose={() => {}} />
        <Window.Tabs>
          {tabs.map((t) => (
            <Window.Tab
              key={t}
              label={t}
              icon="🐱"
              active={t === active}
              onSelect={() => setActive(t)}
              onClose={() => {
                const remaining = tabs.filter((x) => x !== t);
                setTabs(remaining);
                if (t === active && remaining[0]) setActive(remaining[0]);
              }}
            />
          ))}
        </Window.Tabs>
        <Window.AddressBar url={`https://jordanscamp.site/blog/${active.toLowerCase()}`} />
        <Window.Body>
          <Text>Showing: {active}</Text>
        </Window.Body>
      </Window>
    );
  },
};
