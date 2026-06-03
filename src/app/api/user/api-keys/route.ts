import { requireActiveMutation, requireActiveUser } from "@/lib/session-guards";
import { API_KEY_SCOPES, generateApiKeyMaterial } from "@/lib/api-key-auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  scopes: z.array(z.string()).min(1),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export async function GET(): Promise<NextResponse> {
  try {
    const active = await requireActiveUser();
    if (active.error) return active.error;

    const keys = await db.apiKey.findMany({
      where: { userId: active.session.user.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ keys, allowedScopes: API_KEY_SCOPES });
  } catch (error) {
    logErrorToSentry(error, { route: "GET /api/user/api-keys" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.account, active.session.user.id),
      "ApiKeyCreate"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const invalidScopes = parsed.data.scopes.filter(
      (scope) => !(API_KEY_SCOPES as readonly string[]).includes(scope) && scope !== "*"
    );
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { error: `Invalid scopes: ${invalidScopes.join(", ")}` },
        { status: 400 }
      );
    }

    const { rawKey, keyPrefix, hashedKey } = generateApiKeyMaterial();
    const expiresAt = parsed.data.expiresInDays
      ? new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const key = await db.apiKey.create({
      data: {
        userId: active.session.user.id,
        name: parsed.data.name,
        keyPrefix,
        hashedKey,
        scopes: parsed.data.scopes,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        key,
        apiKey: rawKey,
        message: "Copy the apiKey value now; it will not be shown again.",
      },
      { status: 201 }
    );
  } catch (error) {
    logErrorToSentry(error, { route: "POST /api/user/api-keys" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
