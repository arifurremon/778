import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Ensures the current session belongs to an administrator.
 * Returns the session if valid, or a NextResponse with an error.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session || !session.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // @ts-ignore - isAdmin is added to the session in the auth callback
  if (!session.user?.isAdmin) {
    return {
      error: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 }),
    };
  }

  return { session };
}
