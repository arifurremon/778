/**
 * Authenticated admin mutations with CSRF headers.
 * Re-exports the shared api client — use for all admin panel write operations.
 */
export { api as adminApi } from "@/lib/api";
