import { getPublishedPostBySlug } from "@/lib/data/public-content";
import sharp from "sharp";

const IMAGE_WIDTH = 600;
const IMAGE_HEIGHT = 315;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

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

async function createWhatsappImage(source: Buffer) {
  const background = await sharp(source)
    .rotate()
    .resize(IMAGE_WIDTH, IMAGE_HEIGHT, { fit: "cover" })
    .blur(16)
    .modulate({ brightness: 0.72, saturation: 0.8 })
    .toBuffer();

  const foreground = await sharp(source)
    .rotate()
    .resize(IMAGE_WIDTH, IMAGE_HEIGHT, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp(background)
    .composite([{ input: foreground, gravity: "center" }])
    .jpeg({ quality: 72, chromaSubsampling: "4:2:0", mozjpeg: true })
    .toBuffer();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const post = await getPublishedPostBySlug(getSlug(file));

  if (!post?.thumbnail) {
    return new Response("Image not found", { status: 404 });
  }

  try {
    const source = await fetchThumbnail(post.thumbnail, request.url);
    const image = await createWhatsappImage(source);

    return new Response(new Uint8Array(image), {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Length": String(image.byteLength),
        "Content-Type": "image/jpeg",
      },
    });
  } catch (error) {
    console.error("Unable to generate WhatsApp share image:", error);
    return new Response("Unable to generate image", { status: 502 });
  }
}
