import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/mail";

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

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
  preferredName: z.string().min(1, "Preferred name is required."),
  mobile: z.string().min(1, "Mobile is required."),
  location: z.string().min(1, "Location is required."),
  dob: z.string().min(1, "Date of birth is required."),
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    
    const nowMs = Date.now();
    const limitRecord = rateLimitMap.get(ip);
    
    if (limitRecord) {
      if (nowMs - limitRecord.timestamp > WINDOW_MS) {
        // Reset if window has passed
        rateLimitMap.set(ip, { count: 1, timestamp: nowMs });
      } else if (limitRecord.count >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { success: false, message: "Too many attempts. Please try again later." },
          { status: 429 }
        );
      } else {
        rateLimitMap.set(ip, { count: limitRecord.count + 1, timestamp: limitRecord.timestamp });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, timestamp: nowMs });
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

    const { email, password, username, name, preferredName, mobile, location, dob } =
      parsed.data;

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

    await db.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        preferredName,
        mobile,
        location,
        dob,
        joinDate,
      },
    });

    // --- Send Welcome Email (Fire and forget, don't block registration) ---
    try {
      await sendWelcomeEmail({
        to: email,
        name: name || "Neighbour",
      });
    } catch (emailError) {
      console.error("[POST /api/auth/register] Welcome email failed:", emailError);
    }

    return NextResponse.json(
      { success: true, message: "Account created." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/auth/register] CRITICAL ERROR:", error);
    
    // Provide a slightly more descriptive message for debugging
    const errorMessage = process.env.NODE_ENV === "development" 
      ? `Registration failed: ${error.message}`
      : "Internal server error. Please try again later.";

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
