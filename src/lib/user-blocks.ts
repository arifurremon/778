import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/** Thrown when a viewer cannot interact with a target user due to blocks. */
export class UserBlockError extends Error {
  constructor(message = "You cannot interact with this user.") {
    super(message);
    this.name = "UserBlockError";
  }
}

/**
 * User IDs the viewer must not interact with (either direction):
 * - users the viewer blocked
 * - users who blocked the viewer
 */
export async function getInteractionBlockedUserIds(viewerId: string): Promise<string[]> {
  const [blockedByViewer, viewersBlockers] = await Promise.all([
    db.blockedUser.findMany({
      where: { blockerId: viewerId },
      select: { blockedId: true },
    }),
    db.blockedUser.findMany({
      where: { blockedId: viewerId },
      select: { blockerId: true },
    }),
  ]);

  return [
    ...new Set([
      ...blockedByViewer.map((row) => row.blockedId),
      ...viewersBlockers.map((row) => row.blockerId),
    ]),
  ];
}

/** @deprecated Prefer getInteractionBlockedUserIds for feed filtering. */
export async function getBlockedUserIds(viewerId: string): Promise<string[]> {
  const rows = await db.blockedUser.findMany({
    where: { blockerId: viewerId },
    select: { blockedId: true },
  });
  return rows.map((row) => row.blockedId);
}

export async function isBlockedBetween(userA: string, userB: string): Promise<boolean> {
  if (userA === userB) return false;

  const block = await db.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
    select: { blockerId: true },
  });

  return block !== null;
}

export async function assertCanInteract(
  viewerId: string,
  targetId: string,
  message = "You cannot interact with this user."
): Promise<void> {
  if (viewerId === targetId) return;

  if (await isBlockedBetween(viewerId, targetId)) {
    throw new UserBlockError(message);
  }
}

export function blockForbiddenResponse(
  message = "You cannot interact with this user."
): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** Hide profile existence when users are blocked (either direction). */
export function blockedProfileResponse(): NextResponse {
  return NextResponse.json({ error: "User not found" }, { status: 404 });
}
