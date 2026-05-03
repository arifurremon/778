import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const f = createUploadthing();
const utapi = new UTApi();

export const ourFileRouter = {
  profileImage: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const existingUser = await db.user.findUnique({
        where: { id: metadata.userId },
        select: { profileImage: true },
      });

      if (existingUser?.profileImage && existingUser.profileImage.includes("utfs.io")) {
        const fileKey = existingUser.profileImage.split("/f/")[1];
        if (fileKey) {
          await utapi.deleteFiles(fileKey);
        }
      }

      await db.user.update({
        where: { id: metadata.userId },
        data: { profileImage: file.url },
      });
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
