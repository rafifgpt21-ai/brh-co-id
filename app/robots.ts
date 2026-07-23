import type { MetadataRoute } from "next";
import { getPublicBaseUrl } from "@/lib/share-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/admin/login"],
        disallow: ["/admin", "/admin/", "/api", "/api/", "/pdf-viewer", "/*/pdf-viewer"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
