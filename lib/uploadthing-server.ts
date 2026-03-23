"use server";

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// Helper to extract fileKey from UploadThing URL
export const getFileKeyFromUrl = async (url: string) => {
  if (!url) return null;
  const parts = url.split("/");
  return parts[parts.length - 1];
};

// Server action to delete files
export async function deleteFilesFromStorage(urls: string[]) {
  const fileKeysResolved = await Promise.all(urls.map((url) => getFileKeyFromUrl(url)));
  const fileKeys = fileKeysResolved.filter((key): key is string => !!key);

  if (fileKeys.length === 0) return { success: true };

  try {
    const result = await utapi.deleteFiles(fileKeys);
    return { success: result.success };
  } catch (error) {
    console.error("Error deleting files from UploadThing:", error);
    return { success: false, error: "Gagal menghapus file dari storage" };
  }
}
