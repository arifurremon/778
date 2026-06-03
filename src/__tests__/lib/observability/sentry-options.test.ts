import { describe, expect, it } from "vitest";
import {
  resolveSentryEnvironment,
  resolveProfilesSampleRate,
  resolveTracesSampleRate,
} from "@/lib/observability/sentry-options";

describe("sentry options", () => {
  it("uses lower sampling in production", () => {
    expect(resolveTracesSampleRate("production")).toBe(0.1);
    expect(resolveProfilesSampleRate("production")).toBe(0.05);
  });

  it("uses higher sampling in staging", () => {
    expect(resolveTracesSampleRate("staging")).toBe(0.5);
    expect(resolveProfilesSampleRate("staging")).toBe(0.2);
  });

  it("defaults environment from NODE_ENV", () => {
    expect(resolveSentryEnvironment()).toBeTruthy();
  });
});
