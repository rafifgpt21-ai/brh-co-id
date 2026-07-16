import { prisma } from "@/lib/prisma";
import materialBookCoverUrls from "@/lib/material-book-cover-urls.json";
import { STATIC_UPLOADTHING_URLS } from "@/lib/uploadthing-protected-files";
import type { UploadReceipt } from "@/lib/uploadthing-types";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

const utapi = new UTApi();
const DELETE_BATCH_SIZE = 100;

export const uploadReceiptSchema = z.object({
  key: z.string().min(1),
  url: z.string().url(),
  type: z.enum(["image", "pdf"]),
  size: z.number().int().nonnegative(),
});

export const uploadReceiptsSchema = z.array(uploadReceiptSchema).max(100);

export type StorageCleanupResult = {
  requested: number;
  deleted: number;
  skippedReferenced: number;
  skippedInvalid: number;
  failed: number;
};

type StoredBlock = { url?: string | null };

export function getFileKeyFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const isLegacyHost = parsed.hostname === "utfs.io";
    const isUfsHost = parsed.hostname === "ufs.sh" || parsed.hostname.endsWith(".ufs.sh");
    if (!isLegacyHost && !isUfsHost) return null;
    const match = parsed.pathname.match(/^\/f\/([^/]+)\/?$/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function validateUploadReceipts(receipts: unknown): UploadReceipt[] | null {
  const parsed = uploadReceiptsSchema.safeParse(receipts ?? []);
  if (!parsed.success) return null;
  if (parsed.data.some((receipt) => getFileKeyFromUrl(receipt.url) !== receipt.key)) return null;
  return parsed.data;
}

export function receiptsMatchUrls(receipts: UploadReceipt[], urls: Array<string | null | undefined>) {
  const referencedKeys = new Set(
    urls.map((url) => (url ? getFileKeyFromUrl(url) : null)).filter((key): key is string => Boolean(key)),
  );
  return receipts.every((receipt) => referencedKeys.has(receipt.key));
}

export async function collectLiveUploadThingKeys() {
  const [posts, quickPosts] = await Promise.all([
    prisma.post.findMany({ select: { thumbnail: true, blocks: true } }),
    prisma.quickPost.findMany({ select: { imageUrl: true } }),
  ]);

  const urls: string[] = [
    ...STATIC_UPLOADTHING_URLS,
    ...Object.values(materialBookCoverUrls),
  ];

  for (const post of posts) {
    if (post.thumbnail) urls.push(post.thumbnail);
    for (const block of post.blocks as StoredBlock[]) {
      if (block.url) urls.push(block.url);
    }
  }
  for (const quickPost of quickPosts) {
    if (quickPost.imageUrl) urls.push(quickPost.imageUrl);
  }

  return new Set(
    urls.map(getFileKeyFromUrl).filter((key): key is string => Boolean(key)),
  );
}

async function deleteKeys(keys: string[]) {
  let deleted = 0;
  let failed = 0;
  for (let index = 0; index < keys.length; index += DELETE_BATCH_SIZE) {
    const batch = keys.slice(index, index + DELETE_BATCH_SIZE);
    try {
      const result = await utapi.deleteFiles(batch);
      if (result.success) deleted += batch.length;
      else failed += batch.length;
    } catch (error) {
      failed += batch.length;
      console.error("Error deleting files from UploadThing:", error);
    }
  }
  return { deleted, failed };
}

export async function deleteIfUnreferenced(
  urlsOrKeys: string[],
  reason = "unspecified",
): Promise<StorageCleanupResult> {
  const uniqueKeys = new Set<string>();
  let skippedInvalid = 0;
  for (const value of urlsOrKeys) {
    const key = getFileKeyFromUrl(value) || (/^[A-Za-z0-9_-]+$/.test(value) ? value : null);
    if (key) uniqueKeys.add(key);
    else skippedInvalid += 1;
  }

  if (uniqueKeys.size === 0) {
    return { requested: urlsOrKeys.length, deleted: 0, skippedReferenced: 0, skippedInvalid, failed: 0 };
  }

  const liveKeys = await collectLiveUploadThingKeys();
  const deletable = [...uniqueKeys].filter((key) => !liveKeys.has(key));
  const skippedReferenced = uniqueKeys.size - deletable.length;
  const result = await deleteKeys(deletable);

  console.info("UploadThing cleanup", {
    reason,
    requested: urlsOrKeys.length,
    candidates: uniqueKeys.size,
    ...result,
    skippedReferenced,
    skippedInvalid,
  });

  return {
    requested: urlsOrKeys.length,
    deleted: result.deleted,
    skippedReferenced,
    skippedInvalid,
    failed: result.failed,
  };
}

export async function rollbackNewUploads(receipts: UploadReceipt[], reason = "rollback") {
  return deleteIfUnreferenced(receipts.map((receipt) => receipt.key), reason);
}

// Backward-compatible helper used by existing content actions.
export async function deleteFilesFromStorage(urls: string[]) {
  const result = await deleteIfUnreferenced(urls, "content-lifecycle");
  return { success: result.failed === 0, ...result };
}

export { utapi };
