import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import path from "path";

describe("staging-smoke script", () => {
  it("exists and delegates core checks to smoke-common.sh", () => {
    const scriptPath = path.join(process.cwd(), "scripts/staging-smoke.sh");
    const commonPath = path.join(process.cwd(), "scripts/smoke-common.sh");
    const script = readFileSync(scriptPath, "utf-8");
    const common = readFileSync(commonPath, "utf-8");

    expect(script).toContain("smoke-common.sh");
    expect(script).toContain("run_core_smoke_checks");
    expect(script).toContain("STAGING_URL");
    expect(common).toContain("/api/v1/health");
    expect(common).toContain("/api/v1/shops");
    expect(common).toContain("check_register_route");
  });
});
