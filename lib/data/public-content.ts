import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

type PublishedPostOptions = {
  search?: string;
  category?: string;
  excludeCategory?: string;
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
  cacheTag("posts");
  cacheLife("minutes");

  const where: Record<string, unknown> = {
    status: "Published",
  };

  if (options?.category) {
    where.category = options.category;
  } else if (options?.excludeCategory) {
    where.category = { not: options.excludeCategory };
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

export async function getHomeFeaturedPosts(limit = 5) {
  "use cache";
  cacheTag("posts");
  cacheLife("minutes");

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
        },
      })
    : [];

  const manualPostById = new Map(manualPosts.map((post) => [post.id, post]));
  const orderedManualPosts = manualPostIds
    .map((id) => manualPostById.get(id))
    .filter((post): post is NonNullable<typeof post> => Boolean(post));
  return orderedManualPosts;
}

export async function getPublishedPostBySlug(slug: string) {
  "use cache";
  cacheTag("posts", `post-slug-${slug}`);
  cacheLife("minutes");

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
  cacheTag("posts");
  cacheLife("minutes");

  const posts = await prisma.post.findMany({
    where: {
      status: "Published",
      category,
      id: { not: excludeId },
    },
  });
  return sortByPublicationDate(posts).slice(0, limit);
}

export async function getPublishedQuickPosts(limit = 12) {
  "use cache";
  cacheTag("quick-posts");
  cacheLife("minutes");

  return prisma.quickPost.findMany({
    where: { status: "Published" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getLatestPublishedQuickPostByType(type: "NORMAL" | "AGENDA" | "QUOTE") {
  "use cache";
  cacheTag("quick-posts");
  cacheLife("minutes");

  return prisma.quickPost.findFirst({
    where: {
      status: "Published",
      type,
    },
    orderBy: { createdAt: "desc" },
  });
}
