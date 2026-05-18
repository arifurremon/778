import { auth } from "@/lib/auth";
import { cachedQuery, invalidateCache } from "@/lib/cache";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { sanitizeUserInput } from "@/lib/sanitize";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ---------------------------------------------------------------------------
// GET /api/user/profile  — authenticated user's full profile (no password)
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cacheKey = `user:${session.user.id}:profile`;

    const user = await cachedQuery(
      cacheKey,
      () => db.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          preferredName: true,
          mobile: true,
          location: true,
          dob: true,
          profileImage: true,
          nameChangeCount: true,
          joinDate: true,
          isAdmin: true,
          isVerified: true,
          isSeller: true,
          isServiceProvider: true,
          registrationStatus: true,
          serviceRegistrationStatus: true,
          verificationRequestStatus: true,
          showShopBadge: true,
          showExpertBadge: true,
          showFullAge: true,
          showBirthdayOnly: true,
          privacySettings: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      900
    );

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/user/profile]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/user/profile  — update profile fields
// ---------------------------------------------------------------------------
const updateProfileSchema = z.object({
  name:            z.string().min(1).optional(),
  preferredName:   z.string().min(1).optional(),
  mobile:          z.string().optional(),
  location:        z.string().optional(),
  dob:             z.string().optional(),
  profileImage:    z.string().url("Profile image must be a valid URL.").optional(),
  privacySettings: z.record(z.string(), z.string()).optional(),
  showShopBadge:   z.boolean().optional(),
  showExpertBadge: z.boolean().optional(),
  showFullAge:     z.boolean().optional(),
  showBirthdayOnly:z.boolean().optional(),
}).strict();

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    let { name, preferredName, mobile, location, dob, profileImage, ...rest } = parsed.data;

    if (name) name = sanitizeUserInput(name);
    if (preferredName) preferredName = sanitizeUserInput(preferredName);
    if (mobile) mobile = sanitizeUserInput(mobile);
    if (location) location = sanitizeUserInput(location);
    if (dob) dob = sanitizeUserInput(dob);

    // Enforce name change limit
    if (name !== undefined) {
      const current = await db.user.findUnique({
        where: { id: session.user.id },
        select: { nameChangeCount: true, name: true },
      });

      if (!current) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      if (current.nameChangeCount >= 2) {
        return NextResponse.json(
          { error: "Name change limit reached." },
          { status: 403 }
        );
      }
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...rest,
        preferredName,
        mobile,
        location,
        dob,
        profileImage,
        ...(name !== undefined
          ? { name, nameChangeCount: { increment: 1 } }
          : {}),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        preferredName: true,
        mobile: true,
        location: true,
        dob: true,
        profileImage: true,
        nameChangeCount: true,
        showShopBadge: true,
        showExpertBadge: true,
        showFullAge: true,
        showBirthdayOnly: true,
        privacySettings: true,
        updatedAt: true,
      },
    });

    await invalidateCache(`user:${session.user.id}:profile`);

    return NextResponse.json(updated);
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/user/profile]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
