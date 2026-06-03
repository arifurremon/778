import { describe, expect, it, beforeEach } from "vitest";
import {
  getMetricsSnapshot,
  recordDbQueryMetric,
  recordRequestMetric,
  resetMetricsForTests,
} from "@/lib/observability/metrics";

describe("observability metrics", () => {
  beforeEach(() => {
    resetMetricsForTests();
  });

  it("records request latency and error rate", () => {
    recordRequestMetric({
      route: "GET /api/health",
      method: "GET",
      statusCode: 200,
      durationMs: 120,
      success: true,
    });
    recordRequestMetric({
      route: "POST /api/orders",
      method: "POST",
      statusCode: 500,
      durationMs: 900,
      success: false,
    });

    const snapshot = getMetricsSnapshot();

    expect(snapshot.requests.total).toBe(2);
    expect(snapshot.requests.errors).toBe(1);
    expect(snapshot.requests.errorRate).toBe(0.5);
    expect(snapshot.requests.latencyMs.count).toBe(2);
    expect(snapshot.requests.latencyMs.p95).toBeGreaterThan(0);
  });

  it("records database query durations", () => {
    recordDbQueryMetric({
      model: "User",
      operation: "findUnique",
      durationMs: 45,
      success: true,
    });
    recordDbQueryMetric({
      model: "Post",
      operation: "findMany",
      durationMs: 220,
      success: false,
    });

    const snapshot = getMetricsSnapshot();

    expect(snapshot.dbQueries.total).toBe(2);
    expect(snapshot.dbQueries.errors).toBe(1);
    expect(snapshot.dbQueries.latencyMs.p95).toBe(220);
  });
});
