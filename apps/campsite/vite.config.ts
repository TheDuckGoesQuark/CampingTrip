import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

/**
 * Answers `/api/contact` locally, so MouseMail can be driven without a deployed
 * endpoint. Off unless `MOCK_CONTACT` is set, and `apply: "serve"` besides, so
 * no build can carry it. `fail` answers 400 and a bare status code answers
 * itself — the failure copy turns on which one, so 429 and 503 have to be
 * reachable too. `MOCK_CONTACT_DELAY` sets how long it takes to answer.
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
            const status = mode === "fail" ? 400 : Number(mode) || 204;
            console.log(`[mock-contact] ${status} ← ${body}`);
            response.statusCode = status;
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
