import { db } from "@/lib/db";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export type IdempotentHandlerResult = {
  status: number;
  body: unknown;
  resourceId?: string;
};

export function idempotentError(error: string, status: number): IdempotentHandlerResult {
  return { status, body: { error } };
}

function hashRequestBody(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body ?? null)).digest("hex");
}

export function getIdempotencyKey(req: NextRequest): string | null {
  const key = req.headers.get("Idempotency-Key") ?? req.headers.get("idempotency-key");
  if (!key?.trim()) return null;
  return key.trim();
}

export function validateIdempotencyKey(key: string): string | null {
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    return "Idempotency-Key must be 8–128 characters (letters, numbers, _ or -).";
  }
  return null;
}

export async function withIdempotency(
  req: NextRequest,
  options: {
    userId: string;
    route: string;
    body: unknown;
    handler: () => Promise<IdempotentHandlerResult>;
  }
): Promise<NextResponse | null> {
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) return null;

  const validationError = validateIdempotencyKey(idempotencyKey);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const requestHash = hashRequestBody(options.body);
  const existing = await db.idempotencyRecord.findUnique({
    where: {
      userId_idempotencyKey_route: {
        userId: options.userId,
        idempotencyKey,
        route: options.route,
      },
    },
  });

  if (existing) {
    if (existing.requestHash !== requestHash) {
      return NextResponse.json(
        { error: "Idempotency-Key was already used with a different request body." },
        { status: 422 }
      );
    }

    return NextResponse.json(existing.responseBody, {
      status: existing.statusCode,
      headers: { "Idempotent-Replayed": "true" },
    });
  }

  const result = await options.handler();
  const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS);

  try {
    await db.idempotencyRecord.create({
      data: {
        userId: options.userId,
        idempotencyKey,
        route: options.route,
        requestHash,
        resourceId: result.resourceId ?? null,
        responseBody: result.body as object,
        statusCode: result.status,
        expiresAt,
      },
    });
  } catch (error) {
    const replay = await db.idempotencyRecord.findUnique({
      where: {
        userId_idempotencyKey_route: {
          userId: options.userId,
          idempotencyKey,
          route: options.route,
        },
      },
    });

    if (replay) {
      return NextResponse.json(replay.responseBody, {
        status: replay.statusCode,
        headers: { "Idempotent-Replayed": "true" },
      });
    }

    throw error;
  }

  return NextResponse.json(result.body, { status: result.status });
}
