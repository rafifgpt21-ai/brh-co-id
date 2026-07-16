import "dotenv/config";

import { writeFile } from "node:fs/promises";
import { collectLiveUploadThingKeys, deleteIfUnreferenced, utapi } from "@/lib/uploadthing-server";

type ListedFile = {
  key: string;
  name: string;
  size: number;
  uploadedAt?: Date | string | number;
};

const PAGE_SIZE = 500;

function readNumberFlag(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const value = process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
  const parsed = value ? Number(value) : fallback;
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Nilai --${name} tidak valid`);
  return parsed;
}

function readStringFlag(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

async function listAllFiles() {
  const files: ListedFile[] = [];
  let offset = 0;
  while (true) {
    const page = await utapi.listFiles({ limit: PAGE_SIZE, offset });
    const pageFiles: ListedFile[] = page.files.map((file) => ({
      key: file.key,
      name: file.name,
      size: file.size,
      uploadedAt: file.uploadedAt,
    }));
    files.push(...pageFiles);
    if (pageFiles.length < PAGE_SIZE) break;
    offset += pageFiles.length;
  }
  return files;
}

async function main() {
  const shouldDelete = process.argv.includes("--delete");
  const olderThanDays = readNumberFlag("older-than-days", 7);
  const jsonPath = readStringFlag("json");
  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

  // Both reads must succeed before any delete is considered.
  const [files, liveKeys] = await Promise.all([listAllFiles(), collectLiveUploadThingKeys()]);
  const orphaned = files.filter((file) => !liveKeys.has(file.key));
  const eligible = orphaned.filter((file) => {
    if (!file.uploadedAt) return false;
    const uploadedAt = new Date(file.uploadedAt).getTime();
    return Number.isFinite(uploadedAt) && uploadedAt <= cutoff;
  });
  const protectedByAge = orphaned.filter((file) => !eligible.includes(file));

  const report = {
    generatedAt: new Date().toISOString(),
    mode: shouldDelete ? "delete" : "dry-run",
    olderThanDays,
    totals: {
      files: files.length,
      bytes: files.reduce((total, file) => total + file.size, 0),
      activeFiles: files.length - orphaned.length,
      activeBytes: files.filter((file) => liveKeys.has(file.key)).reduce((total, file) => total + file.size, 0),
      orphanedFiles: orphaned.length,
      orphanedBytes: orphaned.reduce((total, file) => total + file.size, 0),
      eligibleFiles: eligible.length,
      eligibleBytes: eligible.reduce((total, file) => total + file.size, 0),
      protectedByAgeFiles: protectedByAge.length,
    },
    eligible: eligible.map((file) => ({
      key: file.key,
      name: file.name,
      size: file.size,
      uploadedAt: file.uploadedAt,
    })),
  };

  console.log(`Mode: ${report.mode}`);
  console.log(`Total storage: ${report.totals.files} file (${formatBytes(report.totals.bytes)})`);
  console.log(`Aktif: ${report.totals.activeFiles} file (${formatBytes(report.totals.activeBytes)})`);
  console.log(`Yatim: ${report.totals.orphanedFiles} file (${formatBytes(report.totals.orphanedBytes)})`);
  console.log(`Layak dihapus (>${olderThanDays} hari): ${report.totals.eligibleFiles} file (${formatBytes(report.totals.eligibleBytes)})`);
  for (const file of report.eligible) {
    console.log(`- ${file.key} | ${formatBytes(file.size)} | ${file.name}`);
  }

  if (jsonPath) {
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Laporan JSON: ${jsonPath}`);
  }

  if (!shouldDelete) {
    console.log("Dry-run selesai. Tambahkan --delete untuk menghapus kandidat di atas.");
    return;
  }

  const cleanup = await deleteIfUnreferenced(eligible.map((file) => file.key), "storage-audit");
  console.log(`Dihapus: ${cleanup.deleted}; gagal: ${cleanup.failed}; masih direferensikan: ${cleanup.skippedReferenced}`);
  if (cleanup.failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Audit UploadThing dibatalkan. Tidak ada file yang sengaja dihapus setelah kegagalan ini.");
  console.error(error);
  process.exit(1);
});
