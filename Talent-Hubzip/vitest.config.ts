import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@workspace/db": path.resolve(__dirname, "lib/db/src/index.ts"),
      "@workspace/api-zod": path.resolve(__dirname, "lib/api-zod/src/index.ts"),
    },
  },
});
