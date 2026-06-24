import { defineConfig } from "vitest/config";

// Vitest runs UNIT tests under tests/ only. Playwright e2e/*.spec.ts are driven
// by playwright.config.ts (npm run e2e) — exclude them so vitest doesn't try to
// collect @playwright/test files.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    environment: "node",
    passWithNoTests: true,
  },
});
