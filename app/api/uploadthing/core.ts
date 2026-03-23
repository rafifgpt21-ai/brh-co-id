import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { auth } from "@/auth";

const f = createUploadthing();

// Function to check for actual admin user
const checkAuth = async () => {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") return null;
  return session.user;
};

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 50,
    },
  })
    .middleware(async () => {
      const user = await checkAuth();
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  pdfUploader: f({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 50,
    },
  })
    .middleware(async () => {
      const user = await checkAuth();
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
