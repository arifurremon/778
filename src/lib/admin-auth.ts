import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Ensures the current request belongs to an active administrator.
 *
 * Security model:
 *   1. Verify a valid JWT session exists (authentication).
 *   2. Perform a live database lookup against the User record using the
 *      session user ID (authorization). The DB is the single source of
 *      truth for the isAdmin flag — the JWT claim is NOT trusted for
 *      privilege checks.
 *
 * This eliminates the privilege-escalation window where a revoked admin
 * could retain access until their JWT expired (up to 30 days).
 *
 * Returns { session, dbUser } on success, or { error: NextResponse } on failure.
 * Callers must check for `error` before proceeding:
 *
 *   const result = await requireAdmin();
 *   if (result.error) return result.error;
 *   const { session, dbUser } = result;
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Live DB verification — the JWT isAdmin claim is intentionally ignored here.
  // We fetch only the two scalar fields we need; never over-fetch.
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isAdmin: true },
  });

  if (!dbUser) {
    // User was deleted from the DB but still holds a valid JWT.
    return {
      error: NextResponse.json(
        { error: "Forbidden: Account not found" },
        { status: 403 }
      ),
    };
  }

  if (!dbUser.isAdmin) {
    // isAdmin was revoked in the DB since the JWT was issued.
    return {
      error: NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { session, dbUser };
}
