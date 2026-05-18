import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Soft delete: set deletedAt and clear sensitive information
    await db.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        password: null,
        mobile: null,
        location: null,
        dob: null,
        email: `deleted_${userId}@example.com`, // Avoid unique constraint issues if user signs up again
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
