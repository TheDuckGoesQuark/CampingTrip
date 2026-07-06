import { resolve } from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Builds the in-page overlay as a single IIFE content-script bundle
 * (React + framer-motion, all inlined) and writes it to the extension
 * directory. MV3 content scripts can't use ES module imports at runtime,
 * hence the IIFE single-file output.
 *
 *   pnpm --filter photobroom build:overlay
 */
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  // Don't copy the web app's public/ assets into the extension dir.
  publicDir: false,
  build: {
    outDir: resolve(__dirname, "../../extensions/photobroom"),
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/overlay/content.tsx"),
      name: "PhotoBroomOverlay",
      formats: ["iife"],
      fileName: () => "overlay.js",
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
