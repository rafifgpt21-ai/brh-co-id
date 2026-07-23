import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/data/public-content";
import { buildAbsoluteUrl } from "@/lib/share-url";
import { locales, withLocale } from "@/lib/i18n/config";

const staticPaths = ["/", "/tentang", "/publikasi", "/riset", "/pengabdian", "/kontak", "/explore", "/catatan"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = staticPaths.flatMap((path) => {
    const languages = {
      id: buildAbsoluteUrl(withLocale(path, "id")),
      en: buildAbsoluteUrl(withLocale(path, "en")),
      "x-default": buildAbsoluteUrl(withLocale(path, "id")),
    };

    return locales.map((locale) => ({
      url: languages[locale],
      changeFrequency: path === "/" ? ("daily" as const) : ("weekly" as const),
      priority: path === "/" ? 1 : 0.8,
      alternates: { languages },
    }));
  });

  const posts = await getPublishedPosts();
  const postEntries = posts.flatMap((post) => {
    const languages = {
      id: buildAbsoluteUrl(withLocale(`/post/${post.slug}`, "id")),
      en: buildAbsoluteUrl(withLocale(`/post/${post.slugEn || post.slug}`, "en")),
      "x-default": buildAbsoluteUrl(withLocale(`/post/${post.slug}`, "id")),
    };

    return [
      {
        url: languages.id,
        lastModified: post.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        alternates: { languages },
      },
      {
        url: languages.en,
        lastModified: post.updatedAt,
        changeFrequency: "weekly" as const,
        priority: post.slugEn ? 0.7 : 0.65,
        alternates: { languages },
      },
    ];
  });

  return [...staticEntries, ...postEntries];
}
