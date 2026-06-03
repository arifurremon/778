import { auth } from "@/lib/auth";
import { cachedQuery, invalidateCache } from "@/lib/cache";
import { validateCsrfRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { sanitizeUserInput } from "@/lib/sanitize";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ---------------------------------------------------------------------------
// GET /api/user/profile  — authenticated user's full profile (no password)
// ---------------------------------------------------------------------------
export const dynamic = 'force-dynamic';

export const GET = auth(async (req) => {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cacheKey = `user:${userId}:profile`;

    const user = await cachedQuery(
      cacheKey,
      () => db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          preferredName: true,
          mobile: true,
          location: true,
          profession: true,
          bio: true,
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
          policyAcceptedAt: true,
          policyVersion: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      900,
      "users"
    );

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const neighboursCount = await db.neighbourConnection.count({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    return NextResponse.json({ ...user, neighboursCount });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/user/profile]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/user/profile  — update profile fields
// ---------------------------------------------------------------------------
const updateProfileSchema = z.object({
  name:            z.string().min(1).optional(),
  preferredName:   z.string().min(1).optional(),
  mobile:          z.string().regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Invalid Bangladeshi phone number.").optional(),
  location:        z.string().optional(),
  profession:      z.string().optional(),
  bio:             z.string().max(500, "Bio must be 500 characters or less.").optional(),
  dob:             z.string().optional(),
  profileImage:    z.string().url("Profile image must be a valid URL.").optional(),
  privacySettings: z.record(z.string(), z.string()).optional(),
  showShopBadge:   z.boolean().optional(),
  showExpertBadge: z.boolean().optional(),
  showFullAge:     z.boolean().optional(),
  showBirthdayOnly:z.boolean().optional(),
}).strict();

export const PATCH = auth(async (req) => {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.profile, userId),
      "Profile"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { deletedAt: true, suspendedAt: true },
    });
    if (!dbUser || dbUser.deletedAt || dbUser.suspendedAt) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: unknown = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    let { name, preferredName, mobile, location, profession, bio, dob } = parsed.data;
    const { profileImage, ...rest } = parsed.data;

    if (name) name = sanitizeUserInput(name);
    if (preferredName) preferredName = sanitizeUserInput(preferredName);
    if (mobile) mobile = sanitizeUserInput(mobile);
    if (location) location = sanitizeUserInput(location);
    if (profession) profession = sanitizeUserInput(profession);
    if (bio) bio = sanitizeUserInput(bio);
    if (dob) dob = sanitizeUserInput(dob);

    // Enforce name change limit
    if (name !== undefined) {
      const result = await db.user.updateMany({
        where: {
          id: userId,
          nameChangeCount: { lt: 3 },
        },
        data: {
          name,
          nameChangeCount: { increment: 1 },
        },
      });

      if (result.count === 0) {
        const exists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!exists) return NextResponse.json({ error: "User not found." }, { status: 404 });
        return NextResponse.json({ error: "Name change limit reached (maximum 3 changes allowed)." }, { status: 403 });
      }
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        ...rest,
        preferredName,
        mobile,
        location,
        profession,
        bio,
        dob,
        profileImage,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        preferredName: true,
        mobile: true,
        location: true,
        profession: true,
        bio: true,
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

    await invalidateCache("users");

    return NextResponse.json(updated);
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/user/profile]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
