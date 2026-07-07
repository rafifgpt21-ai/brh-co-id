import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/data/public-content";
import { buildAbsoluteUrl } from "@/lib/share-url";
import { locales } from "@/lib/i18n/config";

const staticPaths = ["", "/explore", "/biografi", "/publikasi", "/riset", "/catatan"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: buildAbsoluteUrl(`/${locale}${path}`),
      lastModified: now,
      changeFrequency: path === "" ? "daily" as const : "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
  );

  const posts = await getPublishedPosts();
  const postEntries = posts.flatMap((post) => [
    {
      url: buildAbsoluteUrl(`/id/post/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    post.slugEn
      ? {
          url: buildAbsoluteUrl(`/en/post/${post.slugEn}`),
          lastModified: post.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }
      : {
          url: buildAbsoluteUrl(`/en/post/${post.slug}`),
          lastModified: post.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.65,
        },
  ]);

  return [...staticEntries, ...postEntries];
}
