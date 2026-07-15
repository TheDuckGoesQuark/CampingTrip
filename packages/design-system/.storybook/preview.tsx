import type { Decorator, Preview } from "@storybook/react-vite";

import "../src/tokens/tokens.css";
import { BrandProvider } from "../src/BrandProvider";

const withBrand: Decorator = (Story) => (
  <BrandProvider>
    <div style={{ padding: 24, background: "var(--brand-bg)", minHeight: "100vh" }}>
      <Story />
    </div>
  </BrandProvider>
);

const preview: Preview = {
  decorators: [withBrand],
  parameters: {
    layout: "fullscreen",
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
