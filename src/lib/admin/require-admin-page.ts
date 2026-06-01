import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

/**
 * Server Component guard for admin pages.
 * Redirects unauthenticated or non-admin users before data fetching.
 */
export async function requireAdminPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isAdmin: true, deletedAt: true, suspendedAt: true },
  });

  if (!dbUser?.isAdmin || dbUser.deletedAt || dbUser.suspendedAt) {
    redirect("/dashboard?error=unauthorized");
  }

  return { session, dbUser };
}
