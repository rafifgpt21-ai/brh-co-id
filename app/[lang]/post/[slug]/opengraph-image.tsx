import { getPublishedPostBySlug } from "@/lib/data/public-content";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { localizePost } from "@/lib/i18n/posts";
import { ImageResponse } from "next/og";

export const alt = "Artikel BRH Insight";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const runtime = "nodejs";

async function getImageDataUrl(url?: string | null) {
  if (!url) return null;

  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) return null;

    const mimeType = response.headers.get("content-type") || "image/jpeg";
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    return `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Unable to load article thumbnail for Open Graph image:", error);
    return null;
  }
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = hasLocale(rawLang) ? rawLang : "id";
  const post = await getPublishedPostBySlug(slug);
  const localizedPost = post ? localizePost(post, lang) : null;
  const thumbnailDataUrl = await getImageDataUrl(post?.thumbnail);
  const title = localizedPost?.title || "BRH Insight";
  const category = post?.category || (lang === "id" ? "Pemikiran" : "Perspectives");
  const titleSize = title.length > 80 ? 46 : title.length > 50 ? 54 : 64;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#faf6f2",
          color: "#292f36",
          fontFamily: "Arial, sans-serif",
          padding: 52,
        }}
      >
        <div
          style={{
            width: 526,
            height: 526,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderRadius: 34,
            background: "#f0e9e3",
            border: "1px solid #e4d8cf",
          }}
        >
          {thumbnailDataUrl ? (
            <img
              src={thumbnailDataUrl}
              alt=""
              width="526"
              height="526"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#a52717",
                fontSize: 112,
                fontWeight: 900,
              }}
            >
              BRH
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "8px 4px 8px 56px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 12, height: 12, borderRadius: 999, background: "#a52717" }} />
              <span style={{ color: "#a52717", fontSize: 22, fontWeight: 800 }}>BRH Insight</span>
            </div>
            <span style={{ color: "#8b776c", fontSize: 18 }}>brh.co.id</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                color: "#a52717",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 2.4,
                textTransform: "uppercase",
              }}
            >
              {category}
            </span>
            <div
              style={{
                width: 76,
                height: 6,
                marginTop: 22,
                marginBottom: 24,
                borderRadius: 999,
                background: "#a52717",
              }}
            />
            <div
              style={{
                color: "#292f36",
                fontSize: titleSize,
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: -1.8,
              }}
            >
              {title}
            </div>
          </div>

          <span style={{ color: "#8b776c", fontSize: 19, fontWeight: 600 }}>
            {lang === "id" ? "Menyemai Pemikiran, Menggerakkan Perubahan" : "Sowing Ideas, Moving Change"}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
