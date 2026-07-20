import "dotenv/config";

import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { UTApi, UTFile } from "uploadthing/server";
import { prisma } from "@/lib/prisma";

type PublishStatus = "Published" | "Draft";
type ProfileName = "thumbnail" | "content";

type Args = {
  folder: string;
  image?: string;
  title?: string;
  slug?: string;
  author?: string;
  source?: string;
  sourceLabel?: string;
  publishedAt?: string;
  defaultTime: string;
  timezone: "WIB" | "WITA" | "WIT";
  category: string;
  caption?: string;
  noImage: boolean;
  imageAfter: number;
  status: PublishStatus;
  commit: boolean;
  skipIndex: boolean;
};

type ParsedArticle = {
  title: string;
  slug: string;
  author: string;
  sourceUrl?: string;
  sourceLabel?: string;
  publishedAt: Date;
  publishedLabel: string;
  paragraphs: string[];
};

type CompressionResult = {
  buffer: Buffer;
  mime: string;
  extension: string;
  width: number;
  height: number;
  unchanged: boolean;
};

type PostBlockInput = {
  id: string;
  type: string;
  content: string;
  url?: string;
  title?: string;
  caption?: string;
  isLocked: boolean;
};

const PROFILES = {
  thumbnail: {
    maxLongestEdge: 960,
    minLongestEdge: 512,
    targetBytes: 110 * 1024,
    initialQuality: 72,
    minQuality: 48,
  },
  content: {
    maxLongestEdge: 1600,
    minLongestEdge: 960,
    targetBytes: 280 * 1024,
    initialQuality: 74,
    minQuality: 52,
  },
} as const;

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const EFFICIENT_PASSTHROUGH_FORMATS = new Set(["webp", "heif"]);

function usage() {
  console.log(`
Publikasikan artikel BRH dari satu folder material.

Pemakaian:
  npx tsx .agent/tools/seed-news-article.ts --folder "material/artikel/Jumat 17 juli"
  npx tsx .agent/tools/seed-news-article.ts --folder "..." --commit

Opsi:
  --folder <path>         Folder berisi artikel.md dan, biasanya, satu gambar
  --image <path>          Pilih gambar jika folder memuat lebih dari satu gambar
  --no-image              Buat Draft tanpa thumbnail/block gambar
  --title <text>          Override judul hasil ekstraksi
  --slug <text>           Override slug (default: dibentuk dari judul)
  --author <text>         Override penulis
  --source <url>          Override URL sumber; opsional untuk artikel orisinal
  --source-label <text>   Label untuk block Link
  --published-at <text>   Override waktu terbit lengkap
  --time <HH:mm>          Jam default untuk metadata tanggal saja (default: 08:00)
  --timezone <zona>       WIB, WITA, atau WIT (default: WIB)
  --category <text>       Kategori post (default: Artikel)
  --caption <text>        Caption block gambar
  --image-after <n>       Sisipkan block gambar setelah paragraf ke-n (default: 3; boleh 0)
  --status <value>        Published atau Draft (default: Published)
  --commit                Upload dan tulis ke database; tanpa ini hanya dry-run
  --skip-index            Jangan perbarui indeks chatbot
  --help                  Tampilkan bantuan
`);
}

function takeValue(argv: string[], index: number, option: string) {
  const inline = argv[index].match(new RegExp(`^${option}=(.*)$`));
  if (inline) return { value: inline[1], consumed: 0 };
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${option} membutuhkan nilai`);
  return { value, consumed: 1 };
}

function parseArgs(argv: string[]): Args {
  const result: Args = {
    folder: "",
    defaultTime: "08:00",
    timezone: "WIB",
    category: "Artikel",
    noImage: false,
    imageAfter: 3,
    status: "Published",
    commit: false,
    skipIndex: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help") {
      usage();
      process.exit(0);
    }
    if (arg === "--commit") {
      result.commit = true;
      continue;
    }
    if (arg === "--skip-index") {
      result.skipIndex = true;
      continue;
    }
    if (arg === "--no-image") {
      result.noImage = true;
      continue;
    }

    const option = [
      "--folder", "--image", "--title", "--slug", "--author", "--source", "--source-label",
      "--published-at", "--time", "--timezone", "--category", "--caption", "--image-after", "--status",
    ]
      .find((candidate) => arg === candidate || arg.startsWith(`${candidate}=`));
    if (!option) throw new Error(`Opsi tidak dikenal: ${arg}`);
    const { value, consumed } = takeValue(argv, index, option);
    index += consumed;

    if (option === "--folder") result.folder = value;
    if (option === "--image") result.image = value;
    if (option === "--title") result.title = value;
    if (option === "--slug") result.slug = value;
    if (option === "--author") result.author = value;
    if (option === "--source") result.source = value;
    if (option === "--source-label") result.sourceLabel = value;
    if (option === "--published-at") result.publishedAt = value;
    if (option === "--time") {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error("--time harus berformat HH:mm");
      result.defaultTime = value;
    }
    if (option === "--timezone") {
      const timezone = value.toUpperCase();
      if (timezone !== "WIB" && timezone !== "WITA" && timezone !== "WIT") {
        throw new Error("--timezone harus WIB, WITA, atau WIT");
      }
      result.timezone = timezone;
    }
    if (option === "--category") result.category = value;
    if (option === "--caption") result.caption = value;
    if (option === "--image-after") {
      result.imageAfter = Number.parseInt(value, 10);
      if (!Number.isInteger(result.imageAfter) || result.imageAfter < 0) {
        throw new Error("--image-after harus berupa bilangan bulat non-negatif");
      }
    }
    if (option === "--status") {
      if (value !== "Published" && value !== "Draft") {
        throw new Error("--status harus Published atau Draft");
      }
      result.status = value;
    }
  }

  if (!result.folder) throw new Error("--folder wajib diisi");
  if (result.noImage && result.image) throw new Error("--no-image tidak dapat dipakai bersama --image");
  if (result.noImage && result.status !== "Draft") {
    throw new Error("--no-image hanya dapat dipakai bersama --status Draft");
  }
  return result;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function titleFromSource(sourceUrl: string) {
  const url = new URL(sourceUrl);
  const segment = decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) ?? "");
  if (!segment) return "";
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function labelFromSource(sourceUrl: string) {
  const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");
  if (hostname === "rm.id") return "Rakyat Merdeka";
  return hostname;
}

function parsePublishedAt(value: string) {
  const months: Record<string, number> = {
    januari: 0,
    februari: 1,
    maret: 2,
    april: 3,
    mei: 4,
    juni: 5,
    juli: 6,
    agustus: 7,
    september: 8,
    oktober: 9,
    november: 10,
    desember: 11,
  };
  const match = value.match(
    /(?:senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu)?\s*,?\s*(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*(WIB|WITA|WIT)/i,
  );
  if (!match) throw new Error(`Format waktu terbit tidak dikenali: ${value}`);

  const [, day, monthName, year, hour, minute, zone] = match;
  const offsetHours = zone.toUpperCase() === "WIB" ? 7 : zone.toUpperCase() === "WITA" ? 8 : 9;
  return new Date(
    Date.UTC(
      Number(year),
      months[monthName.toLowerCase()],
      Number(day),
      Number(hour) - offsetHours,
      Number(minute),
    ),
  );
}

function parseArticle(markdown: string, args: Args): ParsedArticle {
  const normalized = markdown.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) throw new Error("artikel.md kosong");

  const lines = normalized.split("\n");
  const metadata: Record<string, string> = {};
  const bodyLines: string[] = [];
  let headingTitle = "";

  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (heading && !headingTitle) {
      headingTitle = heading[1];
      continue;
    }

    const meta = line.match(/^\s*(judul|penulis|sumber|waktu\s+terbit)\s*(?::|\s)\s*(.+?)\s*$/i);
    if (meta) {
      metadata[meta[1].toLowerCase().replace(/\s+/g, " ")] = meta[2];
      continue;
    }

    const plainLine = line.trim().replace(/^\*\*(.*?)\*\*\s*$/, "$1").trim();
    const inlineAuthor = plainLine.match(/^oleh\s*:\s*(.+)$/i);
    if (inlineAuthor && !metadata.penulis) metadata.penulis = inlineAuthor[1].trim();

    const inlineDate = plainLine.match(
      /^((?:senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu)?\s*,?\s*\d{1,2}\s+(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4})(?:\s*\|.*)?$/i,
    );
    if (inlineDate && !metadata["waktu terbit"]) {
      metadata["waktu terbit"] = `${inlineDate[1]} ${args.defaultTime} ${args.timezone}`;
    }
    bodyLines.push(line);
  }

  const sourceValue = args.source || metadata.sumber;
  const sourceUrl = sourceValue?.match(/https?:\/\/\S+/)?.[0]?.replace(/[),.;]+$/, "");
  if (sourceValue && !sourceUrl) throw new Error("Sumber harus memuat URL http/https");
  const author = args.author || metadata.penulis;
  if (!author) throw new Error("Penulis tidak ditemukan; tambahkan metadata penulis/Oleh atau gunakan --author");
  const publishedLabel = args.publishedAt || metadata["waktu terbit"];
  if (!publishedLabel) {
    throw new Error("Waktu terbit tidak ditemukan; tambahkan metadata tanggal atau gunakan --published-at");
  }

  const title = args.title || metadata.judul || headingTitle || (sourceUrl ? titleFromSource(sourceUrl) : "");
  if (!title) throw new Error("Judul tidak dapat ditentukan; gunakan # Judul, metadata judul, atau --title");

  const paragraphs = bodyLines
    .join("\n")
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) throw new Error("Isi artikel tidak ditemukan");

  return {
    title,
    slug: slugify(args.slug || title),
    author,
    sourceUrl,
    sourceLabel: args.sourceLabel || (sourceUrl ? labelFromSource(sourceUrl) : undefined),
    publishedAt: parsePublishedAt(publishedLabel),
    publishedLabel,
    paragraphs,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function paragraphsToHtml(paragraphs: string[]) {
  return paragraphs
    .map((paragraph) => {
      const escaped = escapeHtml(paragraph)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br>");
      return `<p>${escaped}</p>`;
    })
    .join("");
}

async function findImage(folder: string, requested?: string) {
  if (requested) return path.resolve(folder, requested);
  const entries = await readdir(folder, { withFileTypes: true });
  const images = entries
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
  if (images.length === 0) throw new Error("Gambar artikel tidak ditemukan di folder");
  if (images.length > 1) throw new Error("Folder memuat lebih dari satu gambar; pilih dengan --image");
  return path.join(folder, images[0]);
}

function formatFromMetadata(format?: string) {
  if (format === "jpeg") return { mime: "image/jpeg", extension: ".jpg" };
  if (format === "png") return { mime: "image/png", extension: ".png" };
  if (format === "webp") return { mime: "image/webp", extension: ".webp" };
  if (format === "heif") return { mime: "image/avif", extension: ".avif" };
  throw new Error(`Format gambar tidak didukung: ${format ?? "unknown"}`);
}

async function compressImage(source: Buffer, profileName: ProfileName): Promise<CompressionResult> {
  if (source.length > MAX_SOURCE_BYTES) throw new Error("Ukuran gambar sumber maksimal 20 MiB");
  const metadata = await sharp(source, { animated: true }).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) throw new Error("Dimensi gambar tidak dapat dibaca");
  if (width * height > MAX_PIXELS) throw new Error("Resolusi gambar maksimal 40 megapiksel");
  if ((metadata.pages ?? 1) > 1) throw new Error("Gambar animasi tidak didukung");

  const originalFormat = formatFromMetadata(metadata.format);
  const profile = PROFILES[profileName];
  const originalLongestEdge = Math.max(width, height);
  if (
    source.length <= profile.targetBytes &&
    originalLongestEdge <= profile.maxLongestEdge &&
    source.length <= MAX_UPLOAD_BYTES &&
    EFFICIENT_PASSTHROUGH_FORMATS.has(metadata.format ?? "")
  ) {
    return { buffer: source, ...originalFormat, width, height, unchanged: true };
  }

  let longestEdge = Math.min(originalLongestEdge, profile.maxLongestEdge);
  let best: Buffer | null = null;
  let bestWidth = width;
  let bestHeight = height;

  while (true) {
    const scale = originalLongestEdge > longestEdge ? longestEdge / originalLongestEdge : 1;
    const outputWidth = Math.max(1, Math.round(width * scale));
    const outputHeight = Math.max(1, Math.round(height * scale));

    for (let quality = profile.initialQuality; quality >= profile.minQuality; quality -= 6) {
      const candidate = await sharp(source)
        .rotate()
        .resize(outputWidth, outputHeight, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: Math.max(profile.minQuality, quality) })
        .toBuffer();
      if (!best || candidate.length < best.length) {
        best = candidate;
        bestWidth = outputWidth;
        bestHeight = outputHeight;
      }
      if (candidate.length <= profile.targetBytes) break;
    }

    if (best && best.length <= profile.targetBytes) break;
    if (longestEdge <= profile.minLongestEdge) break;
    longestEdge = Math.max(profile.minLongestEdge, Math.round(longestEdge * 0.85));
  }

  if (!best || best.length > MAX_UPLOAD_BYTES) {
    throw new Error(`Gambar profil ${profileName} tidak dapat dikompresi hingga di bawah 1 MiB`);
  }
  if (
    source.length < best.length &&
    originalLongestEdge <= profile.maxLongestEdge &&
    source.length <= MAX_UPLOAD_BYTES
  ) {
    return { buffer: source, ...originalFormat, width, height, unchanged: true };
  }
  return {
    buffer: best,
    mime: "image/webp",
    extension: ".webp",
    width: bestWidth,
    height: bestHeight,
    unchanged: false,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const folder = path.resolve(args.folder);
  const markdownPath = path.join(folder, "artikel.md");
  const article = parseArticle(await readFile(markdownPath, "utf8"), args);
  const imagePath = args.noImage ? undefined : await findImage(folder, args.image);
  const sourceImage = imagePath ? await readFile(imagePath) : undefined;
  const [thumbnail, contentImage] = sourceImage
    ? await Promise.all([
        compressImage(sourceImage, "thumbnail"),
        compressImage(sourceImage, "content"),
      ])
    : [undefined, undefined];
  const existing = await prisma.post.findFirst({
    where: { OR: [{ slug: article.slug }, { title: article.title }] },
    select: { id: true, slug: true },
  });

  const preview = {
    mode: args.commit ? "commit" : "dry-run",
    title: article.title,
    slug: article.slug,
    author: article.author,
    sourceUrl: article.sourceUrl,
    publishedAt: article.publishedAt.toISOString(),
    category: args.category,
    status: args.status,
    paragraphs: article.paragraphs.length,
    imageMode: args.noImage ? "deferred" : "included",
    imagePath: imagePath ?? null,
    sourceBytes: sourceImage?.length ?? null,
    thumbnailBytes: thumbnail?.buffer.length ?? null,
    contentBytes: contentImage?.buffer.length ?? null,
    thumbnailSavedPercent: sourceImage && thumbnail
      ? Math.max(0, Math.round((1 - thumbnail.buffer.length / sourceImage.length) * 100))
      : null,
    contentSavedPercent: sourceImage && contentImage
      ? Math.max(0, Math.round((1 - contentImage.buffer.length / sourceImage.length) * 100))
      : null,
    thumbnailFormat: thumbnail?.mime ?? null,
    contentFormat: contentImage?.mime ?? null,
    existingPost: existing,
  };
  console.log(JSON.stringify(preview, null, 2));
  if (!args.commit) return;
  if (existing) throw new Error(`Post sudah ada: ${existing.id} (${existing.slug})`);

  const uploadedKeys: string[] = [];
  const utapi = new UTApi();

  try {
    let thumbnailUrl: string | undefined;
    let contentImageUrl: string | undefined;
    if (thumbnail && contentImage) {
      const uploads = await utapi.uploadFiles([
        new UTFile([thumbnail.buffer], `${article.slug}-thumbnail${thumbnail.extension}`, {
          type: thumbnail.mime,
        }),
        new UTFile([contentImage.buffer], `${article.slug}-content${contentImage.extension}`, {
          type: contentImage.mime,
        }),
      ]);
      const [thumbnailUpload, contentUpload] = uploads;
      if (thumbnailUpload.error || !thumbnailUpload.data) {
        throw new Error(`Upload thumbnail gagal: ${thumbnailUpload.error?.message ?? "unknown"}`);
      }
      uploadedKeys.push(thumbnailUpload.data.key);
      thumbnailUrl = thumbnailUpload.data.ufsUrl;
      if (contentUpload.error || !contentUpload.data) {
        throw new Error(`Upload gambar konten gagal: ${contentUpload.error?.message ?? "unknown"}`);
      }
      uploadedKeys.push(contentUpload.data.key);
      contentImageUrl = contentUpload.data.ufsUrl;
    }

    const metadataHtml =
      `<hr><p><strong>Penulis:</strong> ${escapeHtml(article.author)}` +
      `<br><strong>Waktu terbit:</strong> ${escapeHtml(article.publishedLabel)}</p>`;
    let blocks: PostBlockInput[];
    if (contentImageUrl) {
      const splitAt = Math.min(args.imageAfter, article.paragraphs.length);
      const beforeImage = article.paragraphs.slice(0, splitAt);
      const afterImage = article.paragraphs.slice(splitAt);
      blocks = [
        {
          id: randomUUID(),
          type: "text",
          content: paragraphsToHtml(beforeImage),
          isLocked: false,
        },
        {
          id: randomUUID(),
          type: "image",
          content: "",
          url: contentImageUrl,
          title: article.title,
          caption: args.caption || `Ilustrasi: ${article.title}`,
          isLocked: false,
        },
        {
          id: randomUUID(),
          type: "text",
          content: paragraphsToHtml(afterImage) + metadataHtml,
          isLocked: false,
        },
      ];
    } else {
      blocks = [{
        id: randomUUID(),
        type: "text",
        content: paragraphsToHtml(article.paragraphs) + metadataHtml,
        isLocked: false,
      }];
    }
    if (article.sourceUrl) {
      blocks.push({
        id: randomUUID(),
        type: "link",
        content: `Sumber asli artikel ${article.title}.`,
        url: article.sourceUrl,
        title: `Baca di ${article.sourceLabel}`,
        isLocked: false,
      });
    }

    const post = await prisma.post.create({
      data: {
        title: article.title,
        slug: article.slug,
        category: args.category,
        status: args.status,
        thumbnail: thumbnailUrl ?? null,
        publishedAt: article.publishedAt,
        createdAt: article.publishedAt,
        updatedAt: article.publishedAt,
        blocks,
      },
    });

    if (!args.skipIndex && args.status === "Published") {
      try {
        const { indexPublishedPost } = await import("@/lib/chatbot/indexing");
        await indexPublishedPost(post.id);
      } catch (error) {
        console.warn("Post berhasil dibuat, tetapi indeks chatbot belum diperbarui:", error);
      }
    }
    console.log(JSON.stringify({ success: true, postId: post.id, slug: post.slug }, null, 2));
  } catch (error) {
    if (uploadedKeys.length > 0) await utapi.deleteFiles(uploadedKeys);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
