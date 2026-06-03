import { validateCsrfRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { sanitizeUserInput } from "@/lib/sanitize";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const registerSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").regex(/[0-9!@#$%^&*(),.?":{}|<>_]/, "Password must contain at least one number or symbol."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username cannot exceed 20 characters.")
    .regex(/^\w+$/, "Username may only contain letters, numbers, and underscores."),
  name: z.string().min(1, "Name is required."),
  mobile: z.string().regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Invalid Bangladeshi phone number."),
  location: z.string().min(1, "Location is required."),
  dob: z
    .string()
    .min(1, "Date of birth is required.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date of birth."),
  profession: z.string().optional(),
});

function buildVerificationUrl(req: NextRequest, token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  return new URL(`/api/auth/verify-email/${token}`, baseUrl).toString();
}

function generateEmailToken(): { token: string; expiresAt: Date } {
  return {
    token: crypto.randomBytes(32).toString("hex"),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  };
}

function formatUniqueConstraintMessage(err: Prisma.PrismaClientKnownRequestError): string {
  const target = Array.isArray(err.meta?.target) ? err.meta.target : [];
  if (target.includes("email")) return "Email already registered.";
  if (target.includes("username")) return "Username taken.";
  return "This account field is already in use.";
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

try {
    const headersList = await headers();
    const rawForwarded = headersList.get("x-forwarded-for") ?? "";
    const ip = rawForwarded.split(",")[0]?.trim() || "unknown";

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.register, ip),
      "Register"
    );
    if (rateLimitResponse) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please try again later." },
        { status: rateLimitResponse.status, headers: rateLimitResponse.headers }
      );
    }

    const body: unknown = await req.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { success: false, message: firstError?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const { password, ...registrationFields } = parsed.data;
    let { email, username, name, mobile, location, dob, profession } =
      registrationFields;

    email = email.toLowerCase().trim();
    username = sanitizeUserInput(username).trim();
    name = sanitizeUserInput(name).trim();
    mobile = sanitizeUserInput(mobile).trim();
    location = sanitizeUserInput(location).trim();
    dob = sanitizeUserInput(dob).trim();
    if (profession) profession = sanitizeUserInput(profession).trim();

    const [emailOwner, usernameOwner] = await Promise.all([
      db.user.findUnique({ where: { email }, select: { id: true } }),
      db.user.findUnique({ where: { username }, select: { id: true } }),
    ]);

    if (emailOwner) {
      return NextResponse.json(
        { success: false, message: "Email already registered." },
        { status: 409 }
      );
    }

    if (usernameOwner) {
      return NextResponse.json(
        { success: false, message: "Username taken." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);
    const { token: emailToken, expiresAt: emailTokenExp } = generateEmailToken();

    let user;
    try {
      user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          username,
          name,
          mobile,
          location,
          dob: new Date(dob),
          profession: profession || null,
          emailToken,
          emailTokenExp,
          emailVerified: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailToken: true,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return NextResponse.json(
          { success: false, message: formatUniqueConstraintMessage(err) },
          { status: 409 }
        );
      }
      throw err;
    }

    let emailSent = true;
    let emailError: string | undefined;
    try {
      await sendVerificationEmail(
        user.email,
        buildVerificationUrl(req, user.emailToken!)
      );
    } catch (err) {
      emailSent = false;
      emailError = err instanceof Error ? err.message : "Unknown email error";
      logErrorToSentry(err, {
        endpoint: "/api/auth/register",
        userId: user.id,
        note: "Verification email failed after successful registration",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created. Please check your email to verify your account.",
        ...(emailSent ? {} : { emailSent: false, emailError }),
      },
      { status: 201 }
    );
  } catch (error) {
    logErrorToSentry(error, { endpoint: "/api/auth/register" });
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
