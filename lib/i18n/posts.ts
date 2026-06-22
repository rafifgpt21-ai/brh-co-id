import type { Locale } from "./config";

export function localizePost<T extends Record<string, any>>(post: T, locale: Locale): T {
  if (locale === "id") return post;

  const blocks = Array.isArray(post.blocks)
    ? post.blocks.map((block: Record<string, any>) => ({
        ...block,
        content: block.contentEn || block.content,
        title: block.titleEn || block.title,
        caption: block.captionEn || block.caption,
      }))
    : post.blocks;

  return {
    ...post,
    title: post.titleEn || post.title,
    slug: post.slugEn || post.slug,
    blocks,
    originalSlug: post.slug,
  };
}

export function getLocalizedPostSlug(post: Record<string, any>, locale: Locale) {
  return locale === "en" ? post.slugEn || post.slug : post.slug;
}

export function getCategoryLabel(
  category: string,
  labels: Record<string, string>,
) {
  return labels[category] || category;
}
