import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// GET /api/admin  — Admin dashboard counts
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const [
      totalUsers,
      pendingShops,
      pendingServices,
      pendingVerifications,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { registrationStatus: "PENDING" } }),
      db.user.count({ where: { serviceRegistrationStatus: "PENDING" } }),
      db.user.count({ where: { verificationRequestStatus: "PENDING" } }),
    ]);

    return NextResponse.json({
      totalUsers,
      pendingShops,
      pendingServices,
      pendingVerifications,
    });
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/admin",
      method: "GET",
    });
    return NextResponse.json(
      formatAPIError(error),
      { status: 500 }
    );
  }
}
