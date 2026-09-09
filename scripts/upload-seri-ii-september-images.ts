import "dotenv/config";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { UTApi, UTFile } from "uploadthing/server";

const prisma = new PrismaClient();
const utapi = new UTApi();
const imageDirectory = path.join(
  process.cwd(),
  "public",
  "images",
  "articles",
  "seri-ii-september-2026",
);

const articleImages = [
  { slug: "maaf-berjarak", fileName: "maaf-berjarak.png" },
  { slug: "orang-tua-menunggu", fileName: "orang-tua-menunggu.png" },
  { slug: "berbeda-tetap-beradab", fileName: "berbeda-tetap-beradab.png" },
  { slug: "doa-yang-dewasa", fileName: "doa-yang-dewasa.png" },
  { slug: "usia-bukan-sisa", fileName: "usia-bukan-sisa.png" },
  { slug: "menolong-agar-merdeka", fileName: "menolong-agar-merdeka.png" },
] as const;

type PreparedImage = {
  slug: string;
  fileName: string;
  bytes: Buffer;
  checksum: string;
  customId: string;
};

type UploadedImage = PreparedImage & {
  key: string;
  url: string;
  uploadedNow: boolean;
};

function sha256(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function prepareImages(): Promise<PreparedImage[]> {
  return Promise.all(
    articleImages.map(async ({ slug, fileName }) => {
      const bytes = await readFile(path.join(imageDirectory, fileName));
      const isPng =
        bytes.length > 8 &&
        bytes[0] === 0x89 &&
        bytes.subarray(1, 4).toString("ascii") === "PNG";
      if (!isPng) {
        throw new Error(`${fileName} is not a valid PNG file.`);
      }

      const checksum = sha256(bytes);
      return {
        slug,
        fileName,
        bytes,
        checksum,
        customId: `artikel-seri-ii-${slug}-${checksum.slice(0, 16)}`,
      };
    }),
  );
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

async function uploadOrReuse(image: PreparedImage): Promise<UploadedImage> {
  const existing = await findUploadedFile(image.customId);
  if (existing) {
    const result = await utapi.getFileUrls(existing.key);
    const url = result.data[0]?.url;
    if (!url) {
      throw new Error(`Could not resolve the existing URL for ${image.fileName}.`);
    }
    return { ...image, key: existing.key, url, uploadedNow: false };
  }

  const uploadBytes = new Uint8Array(image.bytes.byteLength);
  uploadBytes.set(image.bytes);
  const file = new UTFile([uploadBytes], image.fileName, {
    customId: image.customId,
    type: "image/png",
  });
  const result = await utapi.uploadFiles(file, {
    acl: "public-read",
    contentDisposition: "inline",
  });

  if (result.error) {
    throw new Error(`Upload failed for ${image.fileName}: ${result.error.message}`);
  }

  return {
    ...image,
    key: result.data.key,
    url: result.data.ufsUrl || result.data.url,
    uploadedNow: true,
  };
}

async function verifyPublicUrl(image: UploadedImage) {
  const response = await fetch(image.url, { method: "HEAD" });
  if (!response.ok) {
    throw new Error(`${image.fileName} is not publicly reachable (${response.status}).`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`${image.fileName} returned unexpected content-type ${contentType}.`);
  }
}

async function updatePosts(images: UploadedImage[]) {
  const posts = await prisma.post.findMany({
    where: { slug: { in: images.map((image) => image.slug) } },
    select: { id: true, slug: true, blocks: true },
  });

  if (posts.length !== images.length) {
    const found = new Set(posts.map((post) => post.slug));
    const missing = images.filter((image) => !found.has(image.slug)).map((image) => image.slug);
    throw new Error(`Posts missing from database: ${missing.join(", ")}`);
  }

  await prisma.$transaction(
    images.map((image) => {
      const post = posts.find((candidate) => candidate.slug === image.slug);
      if (!post) throw new Error(`Post not found: ${image.slug}`);
      const imageBlocks = post.blocks.filter((block) => block.type === "image");
      if (imageBlocks.length !== 1) {
        throw new Error(`${image.slug} must contain exactly one image block.`);
      }

      const blocks = post.blocks.map((block) =>
        block.type === "image"
          ? { ...block, content: "", url: image.url }
          : block,
      );

      return prisma.post.update({
        where: { id: post.id },
        data: { thumbnail: image.url, blocks },
      });
    }),
  );
}

async function verifyDatabase(images: UploadedImage[]) {
  const posts = await prisma.post.findMany({
    where: { slug: { in: images.map((image) => image.slug) } },
    select: { slug: true, status: true, publishedAt: true, thumbnail: true, blocks: true },
  });

  for (const image of images) {
    const post = posts.find((candidate) => candidate.slug === image.slug);
    const imageBlock = post?.blocks.find((block) => block.type === "image");
    if (!post || post.thumbnail !== image.url || imageBlock?.url !== image.url) {
      throw new Error(`Database verification failed for ${image.slug}.`);
    }
    console.log(
      `${image.slug}: ${post.status}, ${post.publishedAt?.toISOString()}, ${image.url}`,
    );
  }
}

async function main() {
  const prepared = await prepareImages();
  console.log("Validated local article images:");
  for (const image of prepared) {
    console.log(`- ${image.fileName} (${image.bytes.byteLength} bytes, ${image.checksum})`);
  }

  if (!process.argv.includes("--apply")) {
    console.log("No uploads or database writes were performed. Pass --apply to continue.");
    return;
  }

  const uploaded: UploadedImage[] = [];
  try {
    for (const image of prepared) {
      const result = await uploadOrReuse(image);
      uploaded.push(result);
      console.log(`${result.uploadedNow ? "Uploaded" : "Reused"}: ${result.fileName}`);
    }

    await Promise.all(uploaded.map(verifyPublicUrl));
    await updatePosts(uploaded);
    await verifyDatabase(uploaded);
    console.log("All six article images are public and linked in the database.");
  } catch (error) {
    const newKeys = uploaded.filter((image) => image.uploadedNow).map((image) => image.key);
    if (newKeys.length > 0) {
      const referencedPosts = await prisma.post.count({
        where: {
          OR: [
            { thumbnail: { in: uploaded.map((image) => image.url) } },
            { blocks: { some: { url: { in: uploaded.map((image) => image.url) } } } },
          ],
        },
      });
      if (referencedPosts === 0) {
        await utapi.deleteFiles(newKeys);
      }
    }
    throw error;
  }
}

main()
  .catch((error) => {
    console.error("Seri II image upload failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
