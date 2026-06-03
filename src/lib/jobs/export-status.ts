import { getExportJob, type ExportJobRecord } from "@/lib/jobs/export-store";
import { NextResponse } from "next/server";

export function buildExportJobResponse(jobId: string, job: ExportJobRecord): NextResponse {
  if (job.status === "completed") {
    return NextResponse.json({
      jobId,
      status: job.status,
      completedAt: job.completedAt,
      data: job.data,
    });
  }

  return NextResponse.json({
    jobId,
    status: job.status,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    error: job.error,
  });
}

export async function getExportJobForUser(
  jobId: string,
  userId: string
): Promise<NextResponse | null> {
  const job = await getExportJob(jobId);
  if (!job || job.userId !== userId) {
    return NextResponse.json({ error: "Export job not found." }, { status: 404 });
  }

  return buildExportJobResponse(jobId, job);
}
