type RequestMetricInput = {
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  success: boolean;
};

type DbQueryMetricInput = {
  model: string;
  operation: string;
  durationMs: number;
  success: boolean;
};

type LatencyBucket = {
  le: number;
  count: number;
};

type MetricsSnapshot = {
  requests: {
    total: number;
    errors: number;
    errorRate: number;
    latencyMs: {
      count: number;
      sum: number;
      avg: number;
      p50: number;
      p95: number;
      p99: number;
      buckets: LatencyBucket[];
    };
  };
  dbQueries: {
    total: number;
    errors: number;
    latencyMs: {
      count: number;
      sum: number;
      avg: number;
      p95: number;
    };
  };
  updatedAt: string;
};

const LATENCY_BUCKET_UPPER_BOUNDS = [50, 100, 250, 500, 1000, 2000, 5000, Infinity];

const requestDurations: number[] = [];
const dbQueryDurations: number[] = [];
let requestTotal = 0;
let requestErrors = 0;
let dbQueryTotal = 0;
let dbQueryErrors = 0;

const MAX_SAMPLES = 2000;

function pushSample(store: number[], value: number): void {
  store.push(value);
  if (store.length > MAX_SAMPLES) {
    store.splice(0, store.length - MAX_SAMPLES);
  }
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.round(sorted[index] ?? 0);
}

function buildLatencyBuckets(values: number[]): LatencyBucket[] {
  return LATENCY_BUCKET_UPPER_BOUNDS.map((le) => ({
    le: le === Infinity ? 999999 : le,
    count: values.filter((value) => value <= le).length,
  }));
}

export function recordRequestMetric(input: RequestMetricInput): void {
  requestTotal += 1;
  if (!input.success || input.statusCode >= 500) {
    requestErrors += 1;
  }
  pushSample(requestDurations, input.durationMs);
}

export function recordDbQueryMetric(input: DbQueryMetricInput): void {
  dbQueryTotal += 1;
  if (!input.success) {
    dbQueryErrors += 1;
  }
  pushSample(dbQueryDurations, input.durationMs);
}

export function getMetricsSnapshot(): MetricsSnapshot {
  const requestSum = requestDurations.reduce((acc, value) => acc + value, 0);
  const dbSum = dbQueryDurations.reduce((acc, value) => acc + value, 0);

  return {
    requests: {
      total: requestTotal,
      errors: requestErrors,
      errorRate: requestTotal === 0 ? 0 : Number((requestErrors / requestTotal).toFixed(4)),
      latencyMs: {
        count: requestDurations.length,
        sum: Math.round(requestSum),
        avg:
          requestDurations.length === 0
            ? 0
            : Math.round(requestSum / requestDurations.length),
        p50: percentile(requestDurations, 50),
        p95: percentile(requestDurations, 95),
        p99: percentile(requestDurations, 99),
        buckets: buildLatencyBuckets(requestDurations),
      },
    },
    dbQueries: {
      total: dbQueryTotal,
      errors: dbQueryErrors,
      latencyMs: {
        count: dbQueryDurations.length,
        sum: Math.round(dbSum),
        avg:
          dbQueryDurations.length === 0 ? 0 : Math.round(dbSum / dbQueryDurations.length),
        p95: percentile(dbQueryDurations, 95),
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function resetMetricsForTests(): void {
  requestDurations.length = 0;
  dbQueryDurations.length = 0;
  requestTotal = 0;
  requestErrors = 0;
  dbQueryTotal = 0;
  dbQueryErrors = 0;
}
