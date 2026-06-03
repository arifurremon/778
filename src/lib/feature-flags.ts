/**
 * Feature flags — env-driven toggles for gradual rollouts (Phase 7.5).
 * LaunchDarkly can replace this module later without changing call sites.
 */

export type FeatureFlag =
  | "asyncJobs"
  | "asyncMail"
  | "asyncBulkMessage"
  | "asyncExport"
  | "asyncRetention"
  | "redisCacheDirectory"
  | "redisCacheEmergency";

const ENV_MAP: Record<FeatureFlag, string> = {
  asyncJobs: "FEATURE_ASYNC_JOBS",
  asyncMail: "FEATURE_ASYNC_MAIL",
  asyncBulkMessage: "FEATURE_ASYNC_BULK_MESSAGE",
  asyncExport: "FEATURE_ASYNC_EXPORT",
  asyncRetention: "FEATURE_ASYNC_RETENTION",
  redisCacheDirectory: "FEATURE_CACHE_DIRECTORY",
  redisCacheEmergency: "FEATURE_CACHE_EMERGENCY",
};

function parseEnvBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined || value === "") return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

function hasInngestConfigured(): boolean {
  return Boolean(process.env.INNGEST_EVENT_KEY || process.env.INNGEST_SIGNING_KEY);
}

const DEFAULTS: Record<FeatureFlag, boolean> = {
  asyncJobs: hasInngestConfigured(),
  asyncMail: hasInngestConfigured(),
  asyncBulkMessage: hasInngestConfigured(),
  asyncExport: hasInngestConfigured(),
  asyncRetention: hasInngestConfigured(),
  redisCacheDirectory: true,
  redisCacheEmergency: true,
};

/** Returns whether a feature flag is enabled for this process. */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const explicit = parseEnvBoolean(process.env[ENV_MAP[flag]]);
  if (explicit !== undefined) return explicit;
  return DEFAULTS[flag];
}

export function getFeatureFlagsSnapshot(): Record<FeatureFlag, boolean> {
  return Object.keys(DEFAULTS).reduce(
    (acc, key) => {
      acc[key as FeatureFlag] = isFeatureEnabled(key as FeatureFlag);
      return acc;
    },
    {} as Record<FeatureFlag, boolean>
  );
}
