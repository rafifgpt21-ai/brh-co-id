import type { Locale } from "./config";

type LocalizableBlock = {
  content?: string | null;
  contentEn?: string | null;
  title?: string | null;
  titleEn?: string | null;
  caption?: string | null;
  captionEn?: string | null;
  [key: string]: unknown;
};

type LocalizablePost = {
  title: string;
  titleEn?: string | null;
  slug: string;
  slugEn?: string | null;
  blocks?: LocalizableBlock[];
  [key: string]: unknown;
};

export function localizePost<T extends LocalizablePost>(post: T, locale: Locale): T & { originalSlug?: string } {
  if (locale === "id") return post;

  const blocks = Array.isArray(post.blocks)
    ? post.blocks.map((block) => ({
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

export function getLocalizedPostSlug(post: Pick<LocalizablePost, "slug" | "slugEn">, locale: Locale) {
  return locale === "en" ? post.slugEn || post.slug : post.slug;
}

export function getCategoryLabel(
  category: string,
  labels: Record<string, string>,
) {
  return labels[category] || category;
}
