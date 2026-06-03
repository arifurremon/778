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

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(120),
  email: z.string().email("Enter a valid email address."),
  subject: z.string().min(3, "Subject must be at least 3 characters.").max(200),
  message: z.string().min(10, "Message must be at least 10 characters.").max(5000),
});

// POST /api/contact — authenticated user sends an inquiry to the core team
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.contact, session.user.id),
      "Contact",
      { quotaExceededMessage: "Contact limit reached (3/15 min)." }
    );
    if (rateLimitResponse) return rateLimitResponse;

    const body: unknown = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const name = sanitizeUserInput(parsed.data.name);
    const email = parsed.data.email.trim().toLowerCase();
    const subject = sanitizeUserInput(parsed.data.subject);
    const message = sanitizeUserInput(parsed.data.message);

    const inquiry = await db.contactInquiry.create({
      data: {
        userId: session.user.id,
        name,
        email,
        subject,
        message,
      },
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    });

    const supportEmail = await getSupportContactEmail();

    try {
      await sendNotificationEmail(
        supportEmail,
        `[Inquiry] ${subject}`,
        "New Contact Inquiry",
        `From: ${name} (${email})\n\n${message}`,
        `mailto:${email}`,
        "Reply to Sender"
      );
    } catch (emailError) {
      logErrorToSentry(emailError, { route: "[POST /api/contact/email]" });
    }

    return NextResponse.json(
      {
        inquiry: {
          ...inquiry,
          createdAt: inquiry.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/contact]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
