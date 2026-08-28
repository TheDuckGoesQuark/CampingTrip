import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  base: "/",
  // No `manualChunks`, deliberately: naming three/r3f as vendor chunks makes
  // Rollup hoist them into the entry's static imports, off the back of the
  // entry↔scene cycle the shared stores create.
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    server: {
      deps: {
        inline: ["three", "@react-three/fiber", "@react-three/drei", "@react-three/test-renderer"],
      },
    },
  },
});
