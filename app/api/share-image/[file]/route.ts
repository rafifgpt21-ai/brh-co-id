import { getPublishedPostBySlug } from "@/lib/data/public-content";
import sharp from "sharp";

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
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

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapTitle(value: string, maxCharacters: number, maxLines = 5) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];

  for (const word of words) {
    const current = lines.at(-1);
    if (!current || current.length + word.length + 1 > maxCharacters) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${current} ${word}`;
    }
  }

  if (lines.length <= maxLines) return lines;
  const visibleLines = lines.slice(0, maxLines);
  const remainingWords = lines.slice(maxLines - 1).join(" ");
  visibleLines[maxLines - 1] = `${remainingWords.slice(0, maxCharacters - 1).trim()}…`;
  return visibleLines;
}

function createTextOverlay({
  title,
  category,
  hasThumbnail,
}: {
  title: string;
  category: string;
  hasThumbnail: boolean;
}) {
  const fontSize = title.length > 100 ? 38 : title.length > 72 ? 42 : title.length > 44 ? 46 : 60;
  const maxCharacters = title.length > 100 ? 24 : title.length > 72 ? 21 : title.length > 44 ? 18 : 18;
  const lineHeight = Math.round(fontSize * 1.12);
  const titleLines = wrapTitle(title, maxCharacters);
  const titleSvg = titleLines
    .map(
      (line, index) =>
        `<text x="620" y="${254 + index * lineHeight}" font-size="${fontSize}" font-weight="800" fill="#292f36">${escapeXml(line)}</text>`,
    )
    .join("");

  return Buffer.from(`
    <svg width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" viewBox="0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" fill="#faf6f2"/>
      <rect x="48" y="52" width="510" height="526" rx="32" fill="#f0e9e3" stroke="#e1d4cb" stroke-width="2"/>
      ${hasThumbnail ? "" : `
        <circle cx="303" cy="274" r="112" fill="#a52717"/>
        <text x="303" y="302" text-anchor="middle" font-family="Arial, sans-serif" font-size="82" font-weight="900" fill="#ffffff">BRH</text>
        <text x="303" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="4" fill="#8b776c">INSIGHT</text>
      `}
      <g font-family="Arial, sans-serif">
        <circle cx="629" cy="82" r="7" fill="#a52717"/>
        <text x="650" y="91" font-size="25" font-weight="800" fill="#a52717">BRH Insight</text>
        <text x="1144" y="91" text-anchor="end" font-size="19" font-weight="600" fill="#8b776c">brh.co.id</text>
        <text x="620" y="178" font-size="20" font-weight="800" letter-spacing="2.5" fill="#a52717">${escapeXml(category.toUpperCase())}</text>
        <rect x="620" y="202" width="82" height="6" rx="3" fill="#a52717"/>
        ${titleSvg}
      </g>
    </svg>
  `);
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
  const overlays: Array<{ input: Buffer; left: number; top: number }> = [
    {
      input: createTextOverlay({ title, category, hasThumbnail: Boolean(source) }),
      left: 0,
      top: 0,
    },
  ];

  if (source) {
    const foreground = await sharp(source)
      .rotate()
      .resize(450, 450, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    overlays.push({ input: foreground, left: 78, top: 90 });
  }

  return sharp({
    create: {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      channels: 4,
      background: "#faf6f2",
    },
  })
    .composite(overlays)
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
    let image: Buffer;
    try {
      image = await createPostShareImage({ source, title, category });
    } catch (error) {
      if (!source) throw error;
      console.warn("Unable to process post thumbnail, using title fallback:", error);
      image = await createPostShareImage({ source: null, title, category });
    }

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
