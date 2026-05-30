import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimiters } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";
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
    let rateLimitSuccess = true;
    try {
      const result = await Promise.race([
        rateLimiters.register.limit(ip),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
      ]);
      rateLimitSuccess = result.success;
    } catch (err) {
      console.error("[Register] Rate limit skipped due to timeout or Upstash error:", err);
    }
    
    if (!rateLimitSuccess) {
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

    // --- Hash password
    const hashedPassword = await hash(password, 12);

    // --- Create user --------------------------------------------------------
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
          dob,
          profession: profession ?? null,
          emailVerificationToken: crypto.randomBytes(32).toString("hex"),
          emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const field = (err.meta?.target as string[])?.join(", ") ?? "field";
        return NextResponse.json(
          { success: false, message: `This ${field} is already in use.` },
          { status: 409 }
        );
      }
      throw err;
    }

    // --- Send verification email -------------------------------------------
    let emailSent = true;
    let emailError: string | undefined;
    try {
      await sendVerificationEmail(
        user.email,
        user.name,
        user.emailVerificationToken!
      );
    } catch (err) {
      emailSent = false;
      emailError = err instanceof Error ? err.message : "Unknown email error";
      logErrorToSentry(err, {
        endpoint: "/api/auth/register",
        userId: user.id,
        note: "Welcome email failed after successful registration",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. Please check your email to verify your account.",
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
