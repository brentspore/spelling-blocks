import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Standalone from vite.config.ts on purpose: the puzzle tests are pure data
// validation and must not load the TanStack Start / nitro build plugins.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
