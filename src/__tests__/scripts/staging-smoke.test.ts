import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import path from "path";

describe("staging-smoke script", () => {
  it("exists and checks core v1 endpoints", () => {
    const scriptPath = path.join(process.cwd(), "scripts/staging-smoke.sh");
    const content = readFileSync(scriptPath, "utf-8");

    expect(content).toContain("/api/v1/health");
    expect(content).toContain("/api/v1/shops");
    expect(content).toContain("STAGING_URL");
  });
});
