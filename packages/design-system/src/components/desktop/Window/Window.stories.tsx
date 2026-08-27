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

/**
 * The same frame as a browser, minus the tab strip and address bar and plus a
 * toolbar and status bar. Which subparts a caller picks is what makes a window
 * a viewer rather than a browser.
 */
export const ImageViewer: Story = {
  render: () => (
    <Window size="md">
      <Window.TitleBar title="smittens_047.jpg — Preview" onClose={() => {}} />
      <Window.Toolbar>
        <Window.ToolButton label="Zoom out" icon="minus" onClick={() => {}} />
        <Window.ToolButton label="Zoom in" icon="plus" onClick={() => {}} />
        <Window.Separator />
        <Window.ToolButton label="Previous" icon="chevron-left" onClick={() => {}} />
        <Window.ToolButton label="Next" icon="chevron-right" onClick={() => {}} />
      </Window.Toolbar>
      <Window.Body inset>
        <Text>The object on display sits in an inset well.</Text>
      </Window.Body>
      <Window.StatusBar>2048 × 1365 · 1.4 MB · 100%</Window.StatusBar>
    </Window>
  ),
};

/** The smallest frame, for a utility window like a plain-text note. */
export const TextViewer: Story = {
  render: () => (
    <Window size="sm">
      <Window.TitleBar title="notes.txt" onClose={() => {}} />
      <Window.Toolbar>
        <Text variant="label" tone="muted">
          Plain text
        </Text>
      </Window.Toolbar>
      <Window.Body>
        <Text variant="body-sm">buy oat milk</Text>
      </Window.Body>
    </Window>
  ),
};
