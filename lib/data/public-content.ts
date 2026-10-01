import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { HOME_FEATURED_TAG, POST_CONTENT_TAG, POST_FILES_TAG, POST_LISTS_TAG, RELATED_POSTS_TAG, relatedPostsTag } from "@/lib/content-cache";
import { normalizePostSearch, postSearchText, toPostCard } from "@/lib/post-cards";
import type { Locale } from "@/lib/i18n/config";
import {
  LEARNING_MEDIA_CATEGORY,
  SCIENTIFIC_PUBLICATION_CATEGORY_VALUES,
  isScientificPublicationCategory,
} from "@/lib/post-categories";

type PublishedPostOptions = {
  search?: string;
  category?: string;
  collection?: "standard" | "learning-media";
  limit?: number;
};

const HOME_SITE_SETTING_KEY = "home";

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function stripHtml(value: string | null | undefined) {
  return (value || "").replace(/<[^>]*>/g, " ");
}

function sortByPublicationDate<T extends { publishedAt: Date | null; createdAt: Date }>(posts: T[]) {
  return posts.sort((a, b) =>
    (b.publishedAt || b.createdAt).getTime() - (a.publishedAt || a.createdAt).getTime()
  );
}

function postMatchesSearch(
  post: Awaited<ReturnType<typeof prisma.post.findMany>>[number],
  search: string,
) {
  const query = normalizeSearchValue(search);
  if (!query) return true;

  const haystack = normalizeSearchValue([
    post.title,
    post.titleEn,
    post.category,
    ...post.blocks.flatMap((block) => [
      stripHtml(block.content),
      stripHtml(block.contentEn),
      block.title,
      block.titleEn,
      block.caption,
      block.captionEn,
    ]),
  ].filter(Boolean).join(" "));

  return haystack.includes(query);
}

export async function getPublishedPosts(options?: PublishedPostOptions) {
  "use cache";
  cacheTag(POST_LISTS_TAG);
  cacheLife("hours");

  const where: Record<string, unknown> = {
    status: "Published",
  };

  if (options?.collection === "learning-media") {
    where.category = LEARNING_MEDIA_CATEGORY;
  } else if (options?.category && options.category !== LEARNING_MEDIA_CATEGORY) {
    where.category = isScientificPublicationCategory(options.category)
      ? { in: [...SCIENTIFIC_PUBLICATION_CATEGORY_VALUES] }
      : options.category;
  } else {
    where.category = { not: LEARNING_MEDIA_CATEGORY };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const filteredPosts = sortByPublicationDate(options?.search
    ? posts.filter((post) => postMatchesSearch(post, options.search || ""))
    : posts);

  return typeof options?.limit === "number"
    ? filteredPosts.slice(0, options.limit)
    : filteredPosts;
}

export async function getHomeFeaturedPosts(limit = 3) {
  "use cache";
  cacheTag(HOME_FEATURED_TAG);
  cacheLife("hours");

  const setting = await prisma.siteSetting.findUnique({
    where: { key: HOME_SITE_SETTING_KEY },
    select: { homeFeaturedPostIds: true },
  });
  const manualPostIds = Array.from(new Set(setting?.homeFeaturedPostIds || [])).slice(0, limit);

  const manualPosts = manualPostIds.length > 0
    ? await prisma.post.findMany({
        where: {
          id: { in: manualPostIds },
          status: "Published",
          category: { not: LEARNING_MEDIA_CATEGORY },
        },
      })
    : [];

  const manualPostById = new Map(manualPosts.map((post) => [post.id, post]));
  const orderedManualPosts = manualPostIds
    .map((id) => manualPostById.get(id))
    .filter((post): post is NonNullable<typeof post> => Boolean(post));
  for (const id of manualPostIds) cacheTag(`post-${id}`);
  return orderedManualPosts;
}

export async function getPublishedPostBySlug(slug: string) {
  "use cache";
  cacheTag(POST_CONTENT_TAG, `post-slug-${slug}`);
  cacheLife("hours");

  return prisma.post.findFirst({
    where: {
      status: "Published",
      OR: [{ slug }, { slugEn: slug }],
    },
  });
}

export async function getRelatedPublishedPosts({
  category,
  excludeId,
  limit = 3,
}: {
  category: string;
  excludeId: string;
  limit?: number;
}) {
  "use cache";
  cacheTag(RELATED_POSTS_TAG, relatedPostsTag(category));
  cacheLife("hours");

  const posts = await prisma.post.findMany({
    where: {
      status: "Published",
      category: isScientificPublicationCategory(category)
        ? { in: [...SCIENTIFIC_PUBLICATION_CATEGORY_VALUES] }
        : category,
      id: { not: excludeId },
    },
    select: { id: true, title: true, titleEn: true, slug: true, slugEn: true, category: true, thumbnail: true, publishedAt: true, createdAt: true },
  });
  return sortByPublicationDate(posts).slice(0, limit);
}

export async function getPublishedQuickPosts(limit = 12) {
  "use cache";
  cacheTag("quick-posts");
  cacheLife("hours");

  return prisma.quickPost.findMany({
    where: { status: "Published" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getLatestPublishedQuickPostByType(type: "AGENDA" | "QUOTE") {
  "use cache";
  cacheTag("quick-posts");
  cacheLife("hours");

  return prisma.quickPost.findFirst({
    where: {
      status: "Published",
      type,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPublishedQuoteById(id: string) {
  "use cache";
  cacheTag("quick-posts", `quote-${id}`);
  cacheLife("hours");

  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  return prisma.quickPost.findFirst({
    where: {
      id,
      status: "Published",
      type: "QUOTE",
    },
  });
}

async function getPublishedCardIndex(collection: "standard" | "learning-media") {
  "use cache";
  cacheTag(POST_LISTS_TAG);
  cacheLife("hours");
  const posts = sortByPublicationDate(await prisma.post.findMany({
    where: {
      status: "Published",
      category: collection === "learning-media" ? LEARNING_MEDIA_CATEGORY : { not: LEARNING_MEDIA_CATEGORY },
    },
    orderBy: { createdAt: "desc" },
  }));
  // Search text stays server-side. Each query reuses this bounded cache instead
  // of caching another copy of full articles for every search string.
  return posts.map((post) => ({
    search: postSearchText(post),
    id: toPostCard(post, "id"),
    en: toPostCard(post, "en"),
  }));
}

export async function getPublishedPostCards(options: PublishedPostOptions | undefined, locale: Locale) {
  const index = await getPublishedCardIndex(options?.collection || "standard");
  const query = normalizePostSearch(options?.search || "");
  const category = options?.category;
  const cards = index.filter((entry) => {
    if (query && !entry.search.includes(query)) return false;
    if (!category || category === LEARNING_MEDIA_CATEGORY) return true;
    return isScientificPublicationCategory(category)
      ? isScientificPublicationCategory(entry.id.category)
      : entry.id.category === category;
  }).map((entry) => entry[locale]);
  return typeof options?.limit === "number" ? cards.slice(0, options.limit) : cards;
}

export async function getFilePostMetadata(url: string) {
  "use cache";
  cacheTag(POST_FILES_TAG);
  cacheLife("hours");
  return prisma.post.findFirst({
    where: { blocks: { some: { url: { equals: url } } } },
    select: { status: true, category: true },
  });
}
