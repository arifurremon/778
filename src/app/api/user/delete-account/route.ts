import { db } from "@/lib/db";
import { requireActiveMutation } from "@/lib/session-guards";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.account, session.user.id),
      "Account"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const userId = session.user.id;

    await db.session.deleteMany({ where: { userId } });

    // Soft delete: set deletedAt and clear sensitive information
    await db.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        password: null,
        mobile: null,
        location: null,
        dob: null,
        email: `deleted_${userId}@example.com`,
        username: `deleted_${userId}`,
        name: "Deleted User",
      },
    });

    return NextResponse.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/user/delete-account",
      method: "DELETE"
    });
    return NextResponse.json(
      formatAPIError(error),
      { status: 500 }
    );
  }
}
