// Fixed: 5 — Resolved TOCTOU race condition in name change API using atomic updateMany.
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
          createdAt: true,
          updatedAt: true,
        },
      }),
      900
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
  mobile:          z.string().optional(),
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
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
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

    let { name, preferredName, mobile, location, profession, bio, dob, profileImage, ...rest } = parsed.data;

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
          nameChangeCount: { lt: 3 }, // atomic guard
        },
        data: {
          name,
          nameChangeCount: { increment: 1 },
        },
      });

      if (result.count === 0) {
        // Either user not found, OR nameChangeCount >= 3
        // Distinguish by checking user existence
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

    await invalidateCache(`user:${userId}:profile`);

    return NextResponse.json(updated);
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/user/profile]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
