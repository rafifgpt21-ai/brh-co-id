import { getPublishedQuoteById } from "@/lib/data/public-content";
import { formatLocalizedDate, hasLocale, type Locale } from "@/lib/i18n/config";
import { ImageResponse } from "next/og";

export const alt = "Kutipan BRH Insight";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

function cleanQuote(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit).trim()}…` : value;
}

export default async function QuoteOpenGraphImage({
  params,
}: {
  params: Promise<{ lang: string; type: string; id: string }>;
}) {
  const { lang: rawLang, type, id } = await params;
  const lang: Locale = hasLocale(rawLang) ? rawLang : "id";
  const quote = type === "kutipan" ? await getPublishedQuoteById(id) : null;
  const content = truncate(cleanQuote(quote?.content || "Merawat jiwa, menata peradaban."), 430);
  const fontSize = content.length > 330 ? 36 : content.length > 240 ? 42 : content.length > 160 ? 48 : content.length > 95 ? 55 : 64;
  const date = quote ? formatLocalizedDate(quote.createdAt, lang) : "BRH Insight";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#f8f3ef",
          color: "#1f292e",
          fontFamily: "Arial, sans-serif",
          padding: 48,
        }}
      >
        <div style={{ position: "absolute", width: 420, height: 420, borderRadius: 999, right: -180, top: -190, background: "#ead7cd" }} />
        <div style={{ position: "absolute", width: 360, height: 360, borderRadius: 999, left: -210, bottom: -210, background: "#f0e2d8" }} />
        <div style={{ position: "absolute", left: 22, top: 0, width: 1, height: "100%", background: "#ded0c8" }} />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: 34,
            border: "1px solid #dfd2ca",
            background: "rgba(255,252,249,0.92)",
            padding: "34px 42px 32px",
            boxShadow: "0 28px 70px rgba(61,39,31,0.10)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", color: "#9f2a1c", fontSize: 17, fontWeight: 800, letterSpacing: 3.1, textTransform: "uppercase" }}>
            <span>{lang === "id" ? "Kutipan BRH" : "BRH Quote"}</span>
            <span style={{ height: 1, flex: 1, margin: "0 22px", background: "#ded0c8" }} />
            <span style={{ color: "#8a7970", fontSize: 16, letterSpacing: 0 }}>{date}</span>
          </div>

          <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "18px 12px 6px" }}>
            <span style={{ position: "absolute", right: 48, top: 82, color: "#9f2a1c", opacity: 0.09, fontSize: 150, fontWeight: 900, lineHeight: 1 }}>”</span>
            <div
              style={{
                display: "flex",
                color: "#1f292e",
                fontSize,
                fontWeight: 700,
                fontStyle: "italic",
                lineHeight: 1.24,
                letterSpacing: -1.15,
                maxWidth: 1000,
              }}
            >
              “{content}”
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", color: "#9f2a1c", fontSize: 18, fontWeight: 900, letterSpacing: 4 }}>
              <span style={{ width: 36, height: 2, marginRight: 14, background: "#b46c4c" }} />
              BRH
            </div>
            <div style={{ display: "flex", alignItems: "center", color: "#8a7970", fontSize: 16, fontWeight: 700 }}>
              <span style={{ width: 9, height: 9, marginRight: 10, borderRadius: 999, background: "#9f2a1c" }} />
              brh.co.id
            </div>
          </div>
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
