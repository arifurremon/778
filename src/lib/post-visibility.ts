import { ConnectionStatus, PrivacyLevel } from "@prisma/client";
import { db } from "@/lib/db";

type PostVisibilityFields = {
  authorId: string;
  visibility: PrivacyLevel;
};

/**
 * Returns whether the requester may view a single post (and its comments).
 * Mirrors feed rules in `src/app/api/posts/route.ts`.
 */
export async function canUserViewPost(
  post: PostVisibilityFields,
  viewerUserId: string | null | undefined
): Promise<boolean> {
  if (post.visibility === PrivacyLevel.PUBLIC) {
    return true;
  }

  if (!viewerUserId) {
    return false;
  }

  if (post.authorId === viewerUserId) {
    return true;
  }

  if (post.visibility === PrivacyLevel.PRIVATE) {
    return false;
  }

  if (post.visibility === PrivacyLevel.NEIGHBOURS) {
    const connection = await db.neighbourConnection.findFirst({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [
          { senderId: viewerUserId, receiverId: post.authorId },
          { senderId: post.authorId, receiverId: viewerUserId },
        ],
      },
      select: { id: true },
    });
    return connection !== null;
  }

  return false;
}
