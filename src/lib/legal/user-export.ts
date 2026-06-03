import { db } from "@/lib/db";
import { CURRENT_POLICY_VERSION } from "@/lib/legal/policy";

/** Builds a GDPR-style JSON export of all user-owned data. */
export async function buildUserDataExport(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      preferredName: true,
      mobile: true,
      location: true,
      profession: true,
      bio: true,
      dob: true,
      profileImage: true,
      emailVerified: true,
      joinDate: true,
      isVerified: true,
      isSeller: true,
      isServiceProvider: true,
      registrationStatus: true,
      serviceRegistrationStatus: true,
      verificationRequestStatus: true,
      privacySettings: true,
      policyAcceptedAt: true,
      policyVersion: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const [
    posts,
    comments,
    orders,
    serviceBookings,
    notifications,
    sentRequests,
    receivedRequests,
    blockedUsers,
    savedPosts,
    followedPosts,
    consentRecords,
    activityLogs,
    shop,
    expertService,
    contactInquiries,
    suggestions,
  ] = await Promise.all([
    db.post.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        content: true,
        images: true,
        visibility: true,
        moderationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.comment.findMany({
      where: { authorId: userId },
      select: { id: true, postId: true, text: true, createdAt: true },
    }),
    db.order.findMany({
      where: { buyerId: userId },
      select: {
        id: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.serviceBooking.findMany({
      where: { clientId: userId },
      select: {
        id: true,
        status: true,
        scheduledDate: true,
        createdAt: true,
      },
    }),
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        type: true,
        entityType: true,
        entityId: true,
        metadata: true,
        isRead: true,
        createdAt: true,
      },
    }),
    db.neighbourConnection.findMany({
      where: { senderId: userId },
      select: { id: true, receiverId: true, status: true, createdAt: true },
    }),
    db.neighbourConnection.findMany({
      where: { receiverId: userId },
      select: { id: true, senderId: true, status: true, createdAt: true },
    }),
    db.blockedUser.findMany({
      where: { blockerId: userId },
      select: { blockedId: true, createdAt: true },
    }),
    db.savedPost.findMany({
      where: { userId },
      select: { postId: true, createdAt: true },
    }),
    db.followedPost.findMany({
      where: { userId },
      select: { postId: true, createdAt: true },
    }),
    db.consentRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        type: true,
        granted: true,
        version: true,
        createdAt: true,
      },
    }),
    db.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { type: true, description: true, createdAt: true },
    }),
    db.shop.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        location: true,
        isVerified: true,
        createdAt: true,
      },
    }),
    db.expertService.findUnique({
      where: { userId },
      select: {
        id: true,
        profession: true,
        category: true,
        location: true,
        isVerified: true,
        createdAt: true,
      },
    }),
    db.contactInquiry.findMany({
      where: { userId },
      select: { subject: true, message: true, createdAt: true },
    }),
    db.featureSuggestion.findMany({
      where: { userId },
      select: { title: true, details: true, createdAt: true },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    exportVersion: CURRENT_POLICY_VERSION,
    profile: user,
    posts,
    comments,
    orders,
    serviceBookings,
    notifications,
    neighbours: {
      sent: sentRequests,
      received: receivedRequests,
    },
    blockedUsers,
    savedPosts,
    followedPosts,
    shop,
    expertService,
    contactInquiries,
    featureSuggestions: suggestions,
    consentRecords,
    activityLogs,
  };
}
