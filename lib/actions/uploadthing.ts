"use server";

import { auth } from "@/auth";
import { rollbackNewUploads, validateUploadReceipts } from "@/lib/uploadthing-server";
import type { UploadReceipt } from "@/lib/uploadthing-types";

export async function rollbackUploadedFiles(receipts: UploadReceipt[]) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return { success: false, error: "Unauthorized" };
  }

  const validReceipts = validateUploadReceipts(receipts);
  if (!validReceipts) {
    return { success: false, error: "Receipt upload tidak valid" };
  }

  const cleanup = await rollbackNewUploads(validReceipts, "client-rollback");
  return { success: cleanup.failed === 0, cleanup };
}
