import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const reactSchema = z.object({
  type: z.enum(["helpful", "notHelpful"], {
    errorMap: () => ({ message: "type must be 'helpful' or 'notHelpful'." }),
  }),
});

// ---------------------------------------------------------------------------
// POST /api/posts/[postId]/react  — increment reaction counts (auth required)
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    const postExists = await db.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!postExists) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const body: unknown = await req.json();
    const parsed = reactSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const { type } = parsed.data;

    const updated = await db.post.update({
      where: { id: postId },
      data:
        type === "helpful"
          ? { helpfulCount: { increment: 1 } }
          : { notHelpfulCount: { increment: 1 } },
      select: {
        id: true,
        helpfulCount: true,
        notHelpfulCount: true,
      },
    });

    return NextResponse.json({
      id: updated.id,
      helpfulCount: updated.helpfulCount,
      notHelpfulCount: updated.notHelpfulCount,
    });
  } catch (error) {
    console.error("[POST /api/posts/[postId]/react]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
