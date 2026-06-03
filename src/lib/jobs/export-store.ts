import { Redis } from "@upstash/redis";

const EXPORT_JOB_TTL_SECONDS = 3600;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return Redis.fromEnv();
}

export type ExportJobStatus = "pending" | "completed" | "failed";

export type ExportJobRecord = {
  status: ExportJobStatus;
  userId: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
  data?: unknown;
};

function exportJobKey(jobId: string): string {
  return `export-job:${jobId}`;
}

export async function createExportJobRecord(jobId: string, userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis unavailable for export jobs");

  const record: ExportJobRecord = {
    status: "pending",
    userId,
    createdAt: new Date().toISOString(),
  };

  await redis.set(exportJobKey(jobId), JSON.stringify(record), { ex: EXPORT_JOB_TTL_SECONDS });
}

export async function completeExportJob(jobId: string, data: unknown): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis unavailable for export jobs");

  const existing = await getExportJob(jobId);
  if (!existing) return;

  const record: ExportJobRecord = {
    ...existing,
    status: "completed",
    completedAt: new Date().toISOString(),
    data,
  };

  await redis.set(exportJobKey(jobId), JSON.stringify(record), { ex: EXPORT_JOB_TTL_SECONDS });
}

export async function failExportJob(jobId: string, error: string): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis unavailable for export jobs");

  const existing = await getExportJob(jobId);
  if (!existing) return;

  const record: ExportJobRecord = {
    ...existing,
    status: "failed",
    completedAt: new Date().toISOString(),
    error,
  };

  await redis.set(exportJobKey(jobId), JSON.stringify(record), { ex: EXPORT_JOB_TTL_SECONDS });
}

export async function getExportJob(jobId: string): Promise<ExportJobRecord | null> {
  const redis = getRedis();
  if (!redis) return null;

  const raw = await redis.get<string>(exportJobKey(jobId));
  if (!raw) return null;

  if (typeof raw === "string") {
    return JSON.parse(raw) as ExportJobRecord;
  }

  return raw as unknown as ExportJobRecord;
}
