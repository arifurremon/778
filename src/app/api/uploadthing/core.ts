import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { requireActiveUser } from "@/lib/session-guards";
import { db } from "@/lib/db";

const f = createUploadthing();
const utapi = new UTApi();

export const ourFileRouter = {
  profileImage: f({ image: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(async () => {
      const active = await requireActiveUser();
      if (active.error) throw new UploadThingError("Unauthorized");
      return { userId: active.session.user.id };
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
  imageUploader: f({ image: { maxFileSize: "16MB", maxFileCount: 3 } })
    .middleware(async () => {
      const active = await requireActiveUser();
      if (active.error) throw new UploadThingError("Unauthorized");
      return { userId: active.session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
