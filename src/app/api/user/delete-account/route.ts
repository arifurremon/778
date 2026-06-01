import { db } from "@/lib/db";
import { requireActiveUser } from "@/lib/session-guards";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { validateCsrfRequest } from "@/lib/csrf";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

try {
    const active = await requireActiveUser();
    if (active.error) return active.error;
    const userId = active.session.user.id;

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
