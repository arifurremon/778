import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "json-summary"],
      // Phase 1 gate: routes with integration tests in src/__tests__/api/
      // Target 70% across all API routes is tracked in ENTERPRISE_ROADMAP Phase 2+.
      include: [
        "src/app/api/activity/**",
        "src/app/api/admin/users/**",
        "src/app/api/auth/register/**",
        "src/app/api/contact/**",
        "src/app/api/notifications/**",
        "src/app/api/posts/**",
        "src/app/api/pusher/auth/**",
        "src/app/api/reviews/[reviewId]/**",
        "src/app/api/services/**",
        "src/app/api/shops/**",
        "src/app/api/suggestions/**",
      ],
      thresholds: {
        lines: 40,
        statements: 40,
        functions: 40,
        branches: 28,
      },
    },
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
