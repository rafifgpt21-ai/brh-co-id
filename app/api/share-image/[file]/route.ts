import { PostShareCard } from "@/components/social/PostShareCard";
import { getPublishedPostBySlug } from "@/lib/data/public-content";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const FONT_DIRECTORY = join(process.cwd(), "node_modules", "pdfjs-dist", "standard_fonts");

const socialFontsPromise = Promise.all([
  readFile(join(FONT_DIRECTORY, "LiberationSans-Regular.ttf")),
  readFile(join(FONT_DIRECTORY, "LiberationSans-Bold.ttf")),
]);

function getSlug(file: string) {
  return file.replace(/\.jpe?g$/i, "");
}

async function fetchThumbnail(url: string, requestUrl: string) {
  const resolvedUrl = new URL(url, requestUrl);
  const response = await fetch(resolvedUrl, {
    cache: "force-cache",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Thumbnail request failed with status ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_SOURCE_BYTES) {
    throw new Error("Thumbnail source is too large");
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > MAX_SOURCE_BYTES) {
    throw new Error("Thumbnail source is too large");
  }

  return bytes;
}

async function normalizeThumbnail(source: Buffer) {
  const image = await sharp(source)
    .rotate()
    .resize(450, 450, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return `data:image/png;base64,${image.toString("base64")}`;
}

async function createPostShareImage({
  source,
  title,
  category,
}: {
  source: Buffer | null;
  title: string;
  category: string;
}) {
  let thumbnailDataUrl: string | null = null;

  if (source) {
    try {
      thumbnailDataUrl = await normalizeThumbnail(source);
    } catch (error) {
      console.warn("Unable to process post thumbnail, using title fallback:", error);
    }
  }

  const [regularFont, boldFont] = await socialFontsPromise;
  const response = new ImageResponse(
    PostShareCard({ title, category, thumbnailDataUrl }),
    {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      fonts: [
        { name: "BRHSans", data: regularFont, style: "normal", weight: 400 },
        { name: "BRHSans", data: boldFont, style: "normal", weight: 700 },
      ],
    },
  );
  const png = Buffer.from(await response.arrayBuffer());

  return sharp(png)
    .jpeg({ quality: 82, chromaSubsampling: "4:2:0", mozjpeg: true })
    .toBuffer();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const slug = getSlug(file);
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return new Response("Image not found", { status: 404 });
  }

  try {
    const imageBlock = post.blocks.find(
      (block) => block.type === "image" && (block.url || block.content),
    );
    const thumbnailUrl = post.thumbnail || imageBlock?.url || imageBlock?.content || null;
    let source: Buffer | null = null;

    if (thumbnailUrl) {
      try {
        source = await fetchThumbnail(thumbnailUrl, request.url);
      } catch (error) {
        console.warn("Unable to load post thumbnail, using title fallback:", error);
      }
    }

    const isEnglish = Boolean(post.slugEn && slug === post.slugEn && post.slugEn !== post.slug);
    const title = isEnglish ? post.titleEn || post.title : post.title;
    const category = isEnglish && post.category === "Media Pembelajaran"
      ? "Learning Media"
      : post.category;
    const image = await createPostShareImage({ source, title, category });

    return new Response(new Uint8Array(image), {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Length": String(image.byteLength),
        "Content-Type": "image/jpeg",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Unable to generate post share image:", error);
    return new Response("Unable to generate image", { status: 502 });
  }
}
