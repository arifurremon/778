import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Requires an authenticated user that is not soft-deleted or suspended.
 * Use for privileged API routes instead of trusting the JWT alone.
 */
export async function requireActiveUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      isAdmin: true,
      deletedAt: true,
      suspendedAt: true,
    },
  });

  if (!dbUser || dbUser.deletedAt) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Account not found or deleted" },
        { status: 403 }
      ),
    };
  }

  if (dbUser.suspendedAt) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Account suspended" },
        { status: 403 }
      ),
    };
  }

  return { session, dbUser };
}
