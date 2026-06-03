import { db } from "@/lib/db";
import type { ConsentType } from "@prisma/client";

type RecordConsentInput = {
  userId?: string | null;
  type: ConsentType;
  granted: boolean;
  version?: string | null;
  ipAddress: string;
  userAgent?: string | null;
};

export async function recordConsent({
  userId,
  type,
  granted,
  version,
  ipAddress,
  userAgent,
}: RecordConsentInput): Promise<void> {
  try {
    await db.consentRecord.create({
      data: {
        userId: userId ?? null,
        type,
        granted,
        version: version ?? null,
        ipAddress: ipAddress.split(",")[0]?.trim() || "unknown",
        userAgent: userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("[CONSENT] Failed to record consent:", type, error);
  }
}

export async function recordPolicyAcceptance(
  userId: string,
  ipAddress: string,
  userAgent?: string | null,
  policyVersion?: string
): Promise<void> {
  const version = policyVersion ?? undefined;
  await Promise.all([
    recordConsent({
      userId,
      type: "TERMS",
      granted: true,
      version,
      ipAddress,
      userAgent,
    }),
    recordConsent({
      userId,
      type: "PRIVACY",
      granted: true,
      version,
      ipAddress,
      userAgent,
    }),
  ]);
}
