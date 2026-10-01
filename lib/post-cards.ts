import type { Post } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";

export type PostCard = Pick<Post, "id" | "title" | "slug" | "category" | "thumbnail" | "publishedAt" | "createdAt"> & {
  snippet: string;
};

export function normalizePostSearch(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function postSearchText(post: Pick<Post, "title" | "titleEn" | "category" | "blocks">) {
  return normalizePostSearch([
    post.title, post.titleEn, post.category,
    ...post.blocks.flatMap((block) => [
      (block.content || "").replace(/<[^>]*>/g, " "),
      (block.contentEn || "").replace(/<[^>]*>/g, " "),
      block.title, block.titleEn, block.caption, block.captionEn,
    ]),
  ].filter(Boolean).join(" "));
}

export function toPostCard(post: Pick<Post, "id" | "title" | "titleEn" | "slug" | "slugEn" | "category" | "thumbnail" | "publishedAt" | "createdAt" | "blocks">, locale: Locale): PostCard {
  const text = post.blocks.find((block) => block.type === "text");
  const image = post.blocks.find((block) => block.type === "image");
  const content = locale === "en" ? text?.contentEn || text?.content : text?.content;
  // Match the existing card's snippet exactly, including spacing and ellipsis.
  const plain = content?.replace(/<[^>]*>?/gm, "") || "";
  const imageContent = locale === "en" ? image?.contentEn || image?.content : image?.content;
  return {
    id: post.id,
    title: locale === "en" ? post.titleEn || post.title : post.title,
    slug: locale === "en" ? post.slugEn || post.slug : post.slug,
    category: post.category,
    thumbnail: post.thumbnail || image?.url || imageContent || "",
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    snippet: plain ? plain.slice(0, 100) + (plain.length > 100 ? "..." : "") : "",
  };
}
