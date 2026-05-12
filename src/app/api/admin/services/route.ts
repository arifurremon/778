import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/admin/services  — paginated expert services list
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "all";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { profession: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category !== "all") {
      where.category = { equals: category, mode: "insensitive" };
    }

    const [services, total] = await Promise.all([
      db.expertService.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          profession: true,
          category: true,
          location: true,
          experienceYears: true,
          fee: true,
          rating: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              isServiceProvider: true,
              serviceRegistrationStatus: true,
            },
          },
        },
      }),
      db.expertService.count({ where }),
    ]);

    return NextResponse.json({
      services,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/admin/services]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
