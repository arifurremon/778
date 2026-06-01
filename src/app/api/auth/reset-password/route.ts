import { validateCsrfRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid or expired token"),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

try {
    const headersList = await headers();
    const rawForwarded = headersList.get("x-forwarded-for") ?? "";
    const ip = rawForwarded.split(",")[0]?.trim() || "unknown";

    const rateLimitResponse = await enforceRateLimit(
      () => rateLimiters.resetPassword.limit(ip),
      "ResetPassword"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const body: unknown = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Validation failed." },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    const tokenHash = hashResetToken(token);

    const user = await db.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExp: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    const [updateResult] = await db.$transaction([
      db.user.updateMany({
        where: {
          id: user.id,
          resetToken: tokenHash,
          resetTokenExp: { gt: new Date() },
        },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExp: null,
        },
      }),
      db.session.deleteMany({ where: { userId: user.id } }),
    ]);

    if (updateResult.count !== 1) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/auth/reset-password",
      method: "POST",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
