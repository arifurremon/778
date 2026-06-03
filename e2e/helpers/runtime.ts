import fs from "fs";
import path from "path";

export type E2eRuntimeConfig = {
  dbReady: boolean;
  message?: string;
};

const RUNTIME_CONFIG_PATH = path.join(__dirname, "..", ".runtime-config.json");

export function readE2eRuntimeConfig(): E2eRuntimeConfig {
  try {
    const raw = fs.readFileSync(RUNTIME_CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as E2eRuntimeConfig;
  } catch {
    return { dbReady: false, message: "E2E runtime config not found" };
  }
}

export function isDatabaseReady(): boolean {
  return readE2eRuntimeConfig().dbReady;
}

export const E2E_USER_EMAIL =
  process.env.E2E_USER_EMAIL ?? "e2e@chattala.test";
export const E2E_USER_PASSWORD =
  process.env.E2E_USER_PASSWORD ?? "E2eSecure123!";
export const E2E_ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@chattala.test";
export const E2E_ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? "E2eAdmin123!";
