import k6 from "k6";
import { check, sleep } from "k6";
import http from "k6/http";

/**
 * Phase 7 load smoke test — run against staging/production:
 *   k6 run -e BASE_URL=https://your-staging-url scripts/load-test/k6-smoke.js
 *
 * Exit criteria target: p95 < 2s, error rate < 0.1% at 100 VUs
 */
export const options = {
  stages: [
    { duration: "30s", target: 25 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.001"],
    http_req_duration: ["p(95)<2000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:9002";

export default function loadTest() {
  const health = http.get(`${BASE_URL}/api/v1/health`);
  check(health, { "health status 200": (r) => r.status === 200 });

  const shops = http.get(`${BASE_URL}/api/v1/shops?page=1&limit=12`);
  check(shops, { "shops status 200": (r) => r.status === 200 });

  const services = http.get(`${BASE_URL}/api/v1/services?page=1&limit=12`);
  check(services, { "services status 200": (r) => r.status === 200 });

  const directory = http.get(`${BASE_URL}/api/v1/directory?type=tourism`);
  check(directory, { "directory status 200": (r) => r.status === 200 });

  sleep(1);
}
