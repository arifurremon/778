import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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
    console.error("[DELETE_ACCOUNT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
