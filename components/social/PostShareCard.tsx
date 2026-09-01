type PostShareCardProps = {
  title: string;
  category: string;
  thumbnailDataUrl: string | null;
};

export function PostShareCard({
  title,
  category,
  thumbnailDataUrl,
}: PostShareCardProps) {
  const titleSize = title.length > 100 ? 38 : title.length > 72 ? 42 : title.length > 44 ? 46 : 60;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#faf6f2",
        color: "#292f36",
        fontFamily: "BRHSans",
        padding: 52,
      }}
    >
      <div
        style={{
          width: 510,
          height: 526,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: 32,
          background: "#f0e9e3",
          border: "2px solid #e1d4cb",
        }}
      >
        {thumbnailDataUrl ? (
          // ImageResponse requires a native image element for embedded data URLs.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailDataUrl}
            alt=""
            width="450"
            height="450"
            style={{ width: 450, height: 450, objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "#8b776c",
            }}
          >
            <div
              style={{
                width: 224,
                height: 224,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                background: "#a52717",
                color: "#ffffff",
                fontSize: 82,
                fontWeight: 700,
              }}
            >
              BRH
            </div>
            <div style={{ marginTop: 38, fontSize: 24, fontWeight: 700, letterSpacing: 4 }}>
              INSIGHT
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          minWidth: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          paddingLeft: 62,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: "#a52717" }} />
            <div style={{ marginLeft: 16, color: "#a52717", fontSize: 25, fontWeight: 700 }}>
              BRH Insight
            </div>
          </div>
          <div style={{ color: "#8b776c", fontSize: 19, fontWeight: 700 }}>brh.co.id</div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              color: "#a52717",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          >
            {category}
          </div>
          <div
            style={{
              width: 82,
              height: 6,
              flexShrink: 0,
              marginTop: 20,
              marginBottom: 18,
              borderRadius: 999,
              background: "#a52717",
            }}
          />
          <div
            style={{
              display: "flex",
              color: "#292f36",
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.12,
              overflow: "hidden",
            }}
          >
            {title}
          </div>
        </div>
      </div>
    </div>
  );
}
