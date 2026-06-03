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
      // Phase 2 gate: routes with integration tests in src/__tests__/api/
      // Target 70% across all API routes is tracked in ENTERPRISE_ROADMAP Phase 2+.
      include: [
        "src/app/api/activity/**",
        "src/app/api/admin/users/**",
        "src/app/api/auth/register/**",
        "src/app/api/contact/**",
        "src/app/api/messages/**",
        "src/app/api/notifications/**",
        "src/app/api/orders/**",
        "src/app/api/posts/**",
        "src/app/api/pusher/auth/**",
        "src/app/api/reviews/[reviewId]/**",
        "src/app/api/services/**",
        "src/app/api/shops/**",
        "src/app/api/suggestions/**",
        "src/lib/user-blocks.ts",
        "src/lib/cache.ts",
        "src/lib/validation/password.ts",
      ],
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 55,
        branches: 45,
      },
    },
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
