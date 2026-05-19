import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/mail";
import { rateLimiters } from "@/lib/rate-limit";
import { sanitizeUserInput } from "@/lib/sanitize";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const registerSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username cannot exceed 20 characters.")
    .regex(/^\w+$/, "Username may only contain letters, numbers, and underscores."),
  name: z.string().min(1, "Name is required."),
  mobile: z.string().min(1, "Mobile is required."),
  location: z.string().min(1, "Location is required."),
  dob: z.string().min(1, "Date of birth is required."),
  profession: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    
    // Check Redis-based rate limit
    const { success } = await rateLimiters.register.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body: unknown = await req.json();

    // --- Validation ---------------------------------------------------------
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { success: false, message: firstError?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    let { email, password, username, name, mobile, location, dob, profession } =
      parsed.data;
      
    name = sanitizeUserInput(name);
    location = sanitizeUserInput(location);
    username = sanitizeUserInput(username);
    if (profession) profession = sanitizeUserInput(profession);

    // --- Duplicate checks ---------------------------------------------------
    const existingEmail = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: "Email already registered." },
        { status: 409 }
      );
    }

    const existingUsername = await db.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (existingUsername) {
      return NextResponse.json(
        { success: false, message: "Username taken." },
        { status: 409 }
      );
    }

    // --- Hash password & create user ----------------------------------------
    const hashedPassword = await hash(password, 12);

    const now = new Date();
    const joinDate = now.toLocaleString("default", { month: "long", year: "numeric" });

    const emailToken = crypto.randomBytes(32).toString("hex");

    await db.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        mobile,
        location,
        dob,
        profession: profession || "Not specified",
        joinDate,
        emailToken,
      },
    });

    // --- Send Welcome & Verification Email (Fire and forget) ---
    try {
      const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/verify-email/${emailToken}`;
      await sendVerificationEmail(email, verifyUrl);
      
      // Keep welcome email as well
      await sendWelcomeEmail({
        to: email,
        name: name || "Neighbour",
      });
    } catch (emailError) {
      logErrorToSentry(emailError, { route: "[POST /api/auth/register] Welcome email failed:" });
    }

    return NextResponse.json(
      { success: true, message: "Account created." },
      { status: 201 }
    );
  } catch (error: unknown) {
    logErrorToSentry(error, { route: "[POST /api/auth/register] CRITICAL ERROR:" });
    
    // Provide a slightly more descriptive message for debugging
    const errorMessage = process.env.NODE_ENV === "development" 
      ? `Registration failed: ${error instanceof Error ? error.message : 'An error occurred'}`
      : "Internal server error. Please try again later.";

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
