import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FAF5F1",
          color: "#292F36",
          padding: "72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#A41F13",
            fontSize: 30,
            fontWeight: 800,
          }}
        >
          <span>BRH Insight</span>
          <span style={{ fontSize: 22, color: "#8F7A6E" }}>brh.co.id</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              width: 112,
              height: 8,
              background: "#A41F13",
              borderRadius: 999,
            }}
          />
          <div
            style={{
              maxWidth: 900,
              fontSize: 82,
              lineHeight: 0.95,
              fontWeight: 900,
              letterSpacing: "-1px",
              color: "#A41F13",
            }}
          >
            Menyemai Pemikiran, Menggerakkan Perubahan
          </div>
          <div style={{ maxWidth: 780, fontSize: 30, lineHeight: 1.35, color: "#292F36" }}>
            Arsip intelektual, publikasi, riset, dan catatan pemikiran Budi Rahman Hakim.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
