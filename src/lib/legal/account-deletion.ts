import { db } from "@/lib/db";
import { recordConsent } from "@/lib/legal/consent";

type AnonymizeUserOptions = {
  userId: string;
  ipAddress?: string;
  userAgent?: string | null;
};

/**
 * Soft-deletes and anonymizes a user account while retaining legal-minimum records
 * (orders, audit trails) with PII removed from the live profile.
 */
export async function anonymizeUserAccount({
  userId,
  ipAddress = "unknown",
  userAgent,
}: AnonymizeUserOptions): Promise<void> {
  const anonymizedEmail = `deleted_${userId}@deleted.thechattala.local`;
  const anonymizedUsername = `deleted_${userId.replace(/-/g, "").slice(0, 20)}`;

  await db.$transaction([
    db.session.deleteMany({ where: { userId } }),
    db.account.deleteMany({ where: { userId } }),
    db.post.updateMany({
      where: { authorId: userId },
      data: {
        content: "[Account deleted]",
        images: [],
        checkInLocation: null,
        deletedAt: new Date(),
        moderationStatus: "DELETED",
      },
    }),
    db.comment.updateMany({
      where: { authorId: userId },
      data: {
        text: "[Account deleted]",
        deletedAt: new Date(),
      },
    }),
    db.message.updateMany({
      where: { senderId: userId },
      data: { text: "[Account deleted]" },
    }),
    db.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: anonymizedEmail,
        username: anonymizedUsername,
        password: null,
        name: "Deleted User",
        preferredName: null,
        mobile: null,
        location: null,
        profession: null,
        bio: null,
        dob: null,
        profileImage: null,
        image: null,
        resetToken: null,
        resetTokenExp: null,
        emailToken: null,
        emailTokenExp: null,
        mfaSecret: null,
        mfaEnabled: false,
        privacySettings: {},
        policyAcceptedAt: null,
        policyVersion: null,
        isSeller: false,
        isServiceProvider: false,
        role: "USER",
      },
    }),
  ]);

  await recordConsent({
    userId,
    type: "PRIVACY",
    granted: false,
    ipAddress,
    userAgent,
    version: null,
  });
}

/** Hard-purges users soft-deleted longer than the retention window. */
export async function purgeSoftDeletedUsers(olderThanDays = 30): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  const staleUsers = await db.user.findMany({
    where: {
      deletedAt: { lt: cutoff },
    },
    select: { id: true },
  });

  for (const { id } of staleUsers) {
    await db.$transaction([
      db.consentRecord.deleteMany({ where: { userId: id } }),
      db.activityLog.deleteMany({ where: { userId: id } }),
      db.notification.deleteMany({ where: { userId: id } }),
      db.savedPost.deleteMany({ where: { userId: id } }),
      db.followedPost.deleteMany({ where: { userId: id } }),
      db.userPostReaction.deleteMany({ where: { userId: id } }),
      db.userCommentReaction.deleteMany({ where: { userId: id } }),
      db.blockedUser.deleteMany({
        where: { OR: [{ blockerId: id }, { blockedId: id }] },
      }),
      db.neighbourConnection.deleteMany({
        where: { OR: [{ senderId: id }, { receiverId: id }] },
      }),
      db.user.delete({ where: { id } }),
    ]);
  }

  return staleUsers.length;
}

export async function purgeOldActivityLogs(olderThanMonths = 12): Promise<number> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - olderThanMonths);
  const result = await db.activityLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return result.count;
}

export async function purgeOldAuditLogs(olderThanMonths = 24): Promise<number> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - olderThanMonths);
  const result = await db.auditLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return result.count;
}

export async function runDataRetentionJobs() {
  const [activityPurged, auditPurged, usersPurged] = await Promise.all([
    purgeOldActivityLogs(12),
    purgeOldAuditLogs(24),
    purgeSoftDeletedUsers(30),
  ]);

  return { activityPurged, auditPurged, usersPurged };
}
