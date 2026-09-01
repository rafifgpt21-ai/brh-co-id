import "dotenv/config";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { UTApi, UTFile } from "uploadthing/server";
import { LEARNING_MEDIA_CATEGORY } from "../lib/post-categories";
import {
  deleteIfUnreferenced,
  getFileKeyFromUrl,
} from "../lib/uploadthing-server";

const prisma = new PrismaClient();
const utapi = new UTApi();

const title = "Rencana Pembelajaran Semester (RPS) Akhlak Tasawuf";
const titleEn = "Semester Learning Plan (RPS): Akhlak Tasawuf";
const slug = "rps-akhlaq-tasawuf";
const slugEn = "semester-learning-plan-akhlaq-tasawuf";
const publishedAt = new Date("2026-01-03T12:00:00.000Z");
const pdfFileName = "RPS AKHLAK TASAWUF.pdf";
const pdfPath = path.join(
  process.cwd(),
  "seed-assets",
  "media-pembelajaran",
  pdfFileName,
);

const contentId = [
  "<p>Rencana Pembelajaran Semester mata kuliah <strong>Akhlak Tasawuf</strong> untuk Program Studi Komunikasi dan Penyiaran Islam, Fakultas Dakwah dan Ilmu Komunikasi, UIN Syarif Hidayatullah Jakarta.</p>",
  "<h2>Identitas Mata Kuliah</h2>",
  "<ul>",
  "<li><strong>Kode:</strong> FDK6056208</li>",
  "<li><strong>Bobot:</strong> 2 SKS</li>",
  "<li><strong>Semester:</strong> 1</li>",
  "<li><strong>Dosen pengembang dan pengampu:</strong> Budi Rahman Hakim, M.S.W., PhD.</li>",
  "<li><strong>Tanggal penyusunan:</strong> 3 Januari 2026</li>",
  "</ul>",
  "<h2>Gambaran Pembelajaran</h2>",
  "<p>Mata kuliah ini membahas tasawuf sebagai ilmu pembentukan akhlak melalui pengenalan Allah, Diri Sejati, dan transformasi diri. Pokok kajian mencakup sejarah tasawuf, struktur diri manusia, ruh dan fitrah, ghaflah, dinamika nafs, tazkiyat al-nafs, takhalli, tahalli, tajalli, dzikir sebagai Self Reminder, riyadhah, maqamat dan ahwal, serta aktualisasi Akhlak Tasawuf dalam kehidupan.</p>",
  "<p>Dokumen lengkap memuat CPL, CPMK, Sub-CPMK, bahan kajian, daftar pustaka, metode pembelajaran, rencana pertemuan selama 16 minggu, serta komponen penilaian.</p>",
].join("");

const contentEn = [
  "<p>The Semester Learning Plan for <strong>Akhlak Tasawuf</strong>, offered by the Islamic Communication and Broadcasting Study Program, Faculty of Da'wah and Communication Sciences, UIN Syarif Hidayatullah Jakarta.</p>",
  "<h2>Course Details</h2>",
  "<ul>",
  "<li><strong>Code:</strong> FDK6056208</li>",
  "<li><strong>Credits:</strong> 2</li>",
  "<li><strong>Semester:</strong> 1</li>",
  "<li><strong>Course developer and lecturer:</strong> Budi Rahman Hakim, M.S.W., PhD.</li>",
  "<li><strong>Prepared:</strong> January 3, 2026</li>",
  "</ul>",
  "<h2>Learning Overview</h2>",
  "<p>The course presents Sufism as a discipline of character formation through knowing Allah, recognizing the True Self, and personal transformation. Its topics include the history of Sufism, the structure of the human self, spirit and fitrah, ghaflah, the dynamics of the nafs, tazkiyat al-nafs, takhalli, tahalli, tajalli, remembrance as a Self Reminder, riyadhah, maqamat and ahwal, and the application of Sufi ethics in everyday life.</p>",
  "<p>The complete document contains program and course learning outcomes, weekly outcomes, learning materials, references, teaching methods, a 16-week course plan, and assessment components.</p>",
].join("");

function buildBlocks(pdfUrl: string) {
  return [
    {
      id: "rps-akhlaq-tasawuf-overview",
      type: "text",
      content: contentId,
      contentEn,
      isLocked: false,
    },
    {
      id: "rps-akhlaq-tasawuf-pdf",
      type: "pdf",
      content: pdfUrl,
      contentEn: pdfUrl,
      url: pdfUrl,
      title: "RPS Akhlak Tasawuf",
      titleEn: "Akhlak Tasawuf Semester Learning Plan",
      caption: "Dokumen RPS Akhlak Tasawuf lengkap, 11 halaman.",
      captionEn: "Complete 11-page Akhlak Tasawuf semester learning plan.",
      isLocked: false,
    },
  ];
}

async function findUploadedFile(customId: string) {
  const limit = 500;
  let offset = 0;

  while (true) {
    const page = await utapi.listFiles({ limit, offset });
    const match = page.files.find(
      (file) => file.customId === customId && file.status === "Uploaded",
    );
    if (match) return match;
    if (!page.hasMore) return null;
    offset += page.files.length;
  }
}

async function getOrUploadPdf(
  bytes: Buffer,
  customId: string,
  preferredExistingUrl?: string,
) {
  const existingFile = await findUploadedFile(customId);
  if (existingFile) {
    if (
      preferredExistingUrl &&
      getFileKeyFromUrl(preferredExistingUrl) === existingFile.key
    ) {
      return {
        key: existingFile.key,
        url: preferredExistingUrl,
        uploadedNow: false,
      };
    }
    const fileUrls = await utapi.getFileUrls(existingFile.key);
    const url = fileUrls.data[0]?.url;
    if (!url) throw new Error("URL PDF yang sudah diunggah tidak dapat ditemukan.");
    return { key: existingFile.key, url, uploadedNow: false };
  }

  const uploadBytes = new Uint8Array(bytes.byteLength);
  uploadBytes.set(bytes);
  const file = new UTFile([uploadBytes], pdfFileName, {
    customId,
    type: "application/pdf",
  });
  const result = await utapi.uploadFiles(file, {
    acl: "public-read",
    contentDisposition: "inline",
  });

  if (result.error) {
    throw new Error(`Upload PDF gagal: ${result.error.message}`);
  }

  return {
    key: result.data.key,
    url: result.data.ufsUrl || result.data.url,
    uploadedNow: true,
  };
}

async function main() {
  const pdfBytes = await readFile(pdfPath);
  if (pdfBytes.byteLength > 16 * 1024 * 1024) {
    throw new Error("PDF melebihi batas unggahan 16 MB.");
  }
  if (pdfBytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Seed asset bukan dokumen PDF yang valid.");
  }

  const checksum = createHash("sha256").update(pdfBytes).digest("hex");
  const customId = `media-pembelajaran-rps-akhlaq-tasawuf-${checksum.slice(0, 16)}`;

  if (process.argv.includes("--check")) {
    console.log(`Validated: ${title}`);
    console.log(`PDF: ${pdfFileName} (${pdfBytes.byteLength} bytes, SHA-256 ${checksum})`);
    console.log("No upload or database writes were performed.");
    return;
  }

  const conflicts = await prisma.post.findMany({
    where: {
      OR: [
        { slug },
        { slugEn },
        { title },
      ],
    },
    select: { id: true, title: true, slug: true, blocks: true },
  });
  if (conflicts.some((post) => post.slug !== slug)) {
    throw new Error(
      `Konflik post ditemukan: ${conflicts.map((post) => `${post.title} (${post.slug})`).join(", ")}`,
    );
  }

  const previousPdfUrls = conflicts.flatMap((post) =>
    post.blocks
      .filter((block) => block.type === "pdf" && block.url)
      .map((block) => block.url as string),
  );
  const uploadedPdf = await getOrUploadPdf(
    pdfBytes,
    customId,
    previousPdfUrls[0],
  );

  try {
    const post = await prisma.post.upsert({
      where: { slug },
      update: {
        title,
        titleEn,
        slugEn,
        category: LEARNING_MEDIA_CATEGORY,
        status: "Published",
        thumbnail: null,
        publishedAt,
        blocks: buildBlocks(uploadedPdf.url),
      },
      create: {
        title,
        titleEn,
        slug,
        slugEn,
        category: LEARNING_MEDIA_CATEGORY,
        status: "Published",
        thumbnail: null,
        publishedAt,
        blocks: buildBlocks(uploadedPdf.url),
      },
    });

    const { indexPublishedPost } = await import("../lib/chatbot/indexing");
    await indexPublishedPost(post.id);

    const savedPost = await prisma.post.findUnique({
      where: { id: post.id },
      select: { category: true, status: true, blocks: true },
    });
    const savedPdfBlock = savedPost?.blocks.find(
      (block) => block.type === "pdf" && block.url === uploadedPdf.url,
    );
    if (
      savedPost?.category !== LEARNING_MEDIA_CATEGORY ||
      savedPost.status !== "Published" ||
      savedPost.blocks.length !== 2 ||
      !savedPdfBlock
    ) {
      throw new Error("Verifikasi post setelah seed gagal.");
    }

    const replacedPdfUrls = previousPdfUrls.filter((url) => url !== uploadedPdf.url);
    if (replacedPdfUrls.length > 0) {
      await deleteIfUnreferenced(replacedPdfUrls, "rps-akhlaq-tasawuf-replaced");
    }

    console.log(`${conflicts.length > 0 ? "Updated" : "Created"}: ${post.title}`);
    console.log(`PDF: ${uploadedPdf.url}`);
    console.log(`UploadThing: ${uploadedPdf.uploadedNow ? "uploaded" : "reused"}`);
  } catch (error) {
    if (uploadedPdf.uploadedNow) {
      try {
        await deleteIfUnreferenced([uploadedPdf.key], "rps-akhlaq-tasawuf-rollback");
      } catch (rollbackError) {
        console.error("Rollback PDF UploadThing gagal:", rollbackError);
      }
    }
    throw error;
  }
}

main()
  .catch((error) => {
    console.error("Seed RPS Akhlak Tasawuf gagal.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
