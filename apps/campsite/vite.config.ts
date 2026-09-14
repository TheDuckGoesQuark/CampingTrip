import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

/**
 * Answers `/api/contact` locally, so MouseMail can be driven without a deployed
 * endpoint. Off unless `MOCK_CONTACT` is set, and `apply: "serve"` besides, so
 * no build can carry it. `fail` answers 400 — the only way to reach the failure
 * screen without breaking something real; `MOCK_CONTACT_DELAY` sets how long it
 * takes to answer.
 *
 * It enforces neither the dwell nor the honeypot, so a send accepted here says
 * nothing about what the real endpoint would accept.
 */
function mockContact(): Plugin {
  const mode = process.env.MOCK_CONTACT;
  const delay = Number(process.env.MOCK_CONTACT_DELAY ?? 600);
  return {
    name: "mock-contact",
    apply: "serve",
    configureServer(server) {
      if (mode === undefined || mode === "") return;
      server.middlewares.use("/api/contact", (request, response) => {
        let body = "";
        request.on("data", (chunk) => (body += chunk));
        request.on("end", () => {
          setTimeout(() => {
            const failed = mode === "fail";
            console.log(`[mock-contact] ${failed ? "400" : "204"} ← ${body}`);
            response.statusCode = failed ? 400 : 204;
            response.end();
          }, delay);
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), mockContact()],
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
