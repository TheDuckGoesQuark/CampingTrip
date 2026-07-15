import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest config for the PhotoBroom overlay's unit tests. The extension bundle
 * itself is built via `vite.overlay.config.ts` (`pnpm --filter photobroom build`).
 * There is no web-app build here any more — the landing page moved into the
 * campsite blog.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
