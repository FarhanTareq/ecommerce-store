import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { getAdminProfile, getOwnerConfig } from "@/lib/db/admin";
import { hasAnyPermission } from "@/lib/permissions";

const f = createUploadthing();

const uploadPermissions = [
  "products.create",
  "products.edit",
  "categories.create",
  "categories.edit",
];

export const ourFileRouter = {
  productImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 8,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      const role = (session?.user as { role?: string } | undefined)?.role;
      if (!session?.user) {
        throw new UploadThingError("Sign in to upload images");
      }

      if (role === "owner") {
        const owner = await getOwnerConfig();
        if (owner?.userId !== String(session.user.id)) {
          throw new UploadThingError("Owner access required");
        }
      } else if (role === "admin") {
        const profile = await getAdminProfile(String(session.user.id));
        if (
          !profile ||
          profile.status !== "active" ||
          !hasAnyPermission(profile.permissions, uploadPermissions)
        ) {
          throw new UploadThingError(
            "You do not have permission to upload catalog images",
          );
        }
      } else {
        throw new UploadThingError("Only admins can upload catalog images");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        key: file.key,
        url: file.ufsUrl,
        name: file.name,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
