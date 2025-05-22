import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/__tests__/**/*.ts", "**/*.{test,spec}.ts"],
    environment: "node",
    globals: true,
  },
});
