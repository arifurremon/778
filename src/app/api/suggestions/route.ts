import { requireActiveMutation } from "@/lib/session-guards";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { sendNotificationEmail } from "@/lib/mail";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { getSupportContactEmail } from "@/lib/settings-utils";
import { sanitizeUserInput } from "@/lib/sanitize";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const suggestionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(120),
  details: z.string().max(2000).optional(),
});

// POST /api/suggestions — authenticated user submits a feature suggestion
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.suggestions, session.user.id),
      "Suggestions",
      { quotaExceededMessage: "Suggestion limit reached (5/hour)." }
    );
    if (rateLimitResponse) return rateLimitResponse;

    const body: unknown = await req.json();
    const parsed = suggestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const title = sanitizeUserInput(parsed.data.title);
    const details = parsed.data.details ? sanitizeUserInput(parsed.data.details) : null;

    const suggestion = await db.featureSuggestion.create({
      data: {
        userId: session.user.id,
        title,
        details,
      },
      select: {
        id: true,
        title: true,
        details: true,
        status: true,
        createdAt: true,
      },
    });

    const submitterName = session.user.name ?? session.user.email ?? "A user";
    const supportEmail = await getSupportContactEmail();

    try {
      await sendNotificationEmail(
        supportEmail,
        `[Feature Suggestion] ${title}`,
        "New Feature Suggestion",
        `${submitterName} suggested: "${title}"${
          details ? `\n\nDetails:\n${details}` : ""
        }`,
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin`,
        "Review in Admin"
      );
    } catch (emailError) {
      logErrorToSentry(emailError, { route: "[POST /api/suggestions/email]" });
    }

    return NextResponse.json(
      {
        suggestion: {
          ...suggestion,
          createdAt: suggestion.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/suggestions]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
