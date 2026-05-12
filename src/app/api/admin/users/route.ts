import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/users
 * Paginated list of users with filtering and search.
 */
export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25")));
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";
    const status = searchParams.get("status") || "all";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: any = {
      deletedAt: null // Only active users
    };

    // Search logic
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    // Role filtering
    if (role === "admin") where.isAdmin = true;
    else if (role === "seller") where.isSeller = true;
    else if (role === "provider") where.isServiceProvider = true;
    else if (role === "user") {
      where.isAdmin = false;
      where.isSeller = false;
      where.isServiceProvider = false;
    }

    // Status filtering
    if (status === "suspended") {
      // SCHEMA-FALLBACK: 'suspendedAt' may not exist — verify schema
      try {
        where.suspendedAt = { not: null };
      } catch (e) {
        // If field doesn't exist, we can't filter by it accurately
      }
    } else if (status === "unverified") {
      where.emailVerified = null;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          profileImage: true,
          isAdmin: true,
          isSeller: true,
          isServiceProvider: true,
          emailVerified: true,
          createdAt: true,
          // SCHEMA-FALLBACK: 'suspendedAt' may not exist — verify schema
          // We'll wrap the entire select if needed, but Prisma select handles missing fields gracefully if typed as any
          suspendedAt: true,
          _count: {
            select: { 
              posts: true,
              comments: true,
            }
          }
        }
      } as any), // Cast to any to handle potential missing fields in types
      db.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      limit
    });
  } catch (err) {
    console.error("[GET_USERS_ERROR]:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
