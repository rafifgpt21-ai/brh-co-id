import { revalidateImportedContent } from "./revalidate-content";
import { prepareUploadImage } from "./prepare-upload-image";
import "dotenv/config";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { UTApi, UTFile } from "uploadthing/server";

const prisma = new PrismaClient();
const utapi = new UTApi();
const imageDirectory = path.join(
  process.cwd(),
  "public",
  "images",
  "articles",
  "seri-iii-september-oktober-2026",
);

const articleImages = [
  { slug: "tubuh-yang-berkabar", fileName: "tubuh-yang-berkabar.png" },
  { slug: "cicilan-atas-keinginan", fileName: "cicilan-atas-keinginan.png" },
  { slug: "upah-yang-tak-terlihat", fileName: "upah-yang-tak-terlihat.png" },
  { slug: "piring-yang-mengingat", fileName: "piring-yang-mengingat.png" },
  { slug: "rumah-yang-menopang", fileName: "rumah-yang-menopang.png" },
  { slug: "kota-yang-menyapa", fileName: "kota-yang-menyapa.png" },
  { slug: "warisan-di-awan", fileName: "warisan-di-awan.png" },
  { slug: "ketika-mesin-memilih", fileName: "ketika-mesin-memilih.png" },
  { slug: "cemas-menjaga-bumi", fileName: "cemas-menjaga-bumi.png" },
  { slug: "tangga-yang-bertanya", fileName: "tangga-yang-bertanya.png" },
  { slug: "masa-depan-menitip", fileName: "masa-depan-menitip.png" },
] as const;

type PreparedImage = {
  slug: string;
  fileName: string;
  bytes: Buffer;
  contentType: string;
  originalBytes: number;
  checksum: string;
  customId: string;
  width: number;
  height: number;
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
      const metadata = await sharp(bytes).metadata();
      if (metadata.format !== "png" || !metadata.width || !metadata.height) {
        throw new Error(`${fileName} is not a readable PNG image.`);
      }
      if (metadata.width !== metadata.height) {
        throw new Error(`${fileName} must use a 1:1 aspect ratio.`);
      }
      if (metadata.width < 1000) {
        throw new Error(`${fileName} must be at least 1000px square.`);
      }

      const prepared = await prepareUploadImage(bytes, fileName);
      const checksum = sha256(prepared.bytes);
      return {
        slug,
        ...prepared,
        checksum,
        customId: `artikel-seri-iii-${slug}-${checksum.slice(0, 16)}`,
        width: metadata.width,
        height: metadata.height,
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
    type: image.contentType,
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
  console.log("Validated local Seri III images:");
  for (const image of prepared) {
    console.log(
      `- ${image.fileName} (${image.width}x${image.height}, ${image.originalBytes} -> ${image.bytes.byteLength} bytes, ${image.checksum})`,
    );
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
    await revalidateImportedContent();
    console.log("All eleven Seri III images are public and linked in the database.");
  } catch (error) {
    const newKeys = uploaded.filter((image) => image.uploadedNow).map((image) => image.key);
    if (newKeys.length > 0) {
      const uploadedUrls = uploaded.map((image) => image.url);
      const referencedPosts = await prisma.post.count({
        where: {
          OR: [
            { thumbnail: { in: uploadedUrls } },
            { blocks: { some: { url: { in: uploadedUrls } } } },
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
    console.error("Seri III image upload failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
