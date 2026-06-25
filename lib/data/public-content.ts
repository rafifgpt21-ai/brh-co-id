import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

type PublishedPostOptions = {
  search?: string;
  category?: string;
  limit?: number;
};

export async function getPublishedPosts(options?: PublishedPostOptions) {
  "use cache";
  cacheTag("posts");
  cacheLife("minutes");

  const where: Record<string, unknown> = {
    status: "Published",
  };

  if (options?.search) {
    where.OR = [
      { title: { contains: options.search, mode: "insensitive" } },
      { titleEn: { contains: options.search, mode: "insensitive" } },
    ];
  }

  if (options?.category) {
    where.category = options.category;
  }

  return prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit,
  });
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

  return prisma.post.findMany({
    where: {
      status: "Published",
      category,
      id: { not: excludeId },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
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

export async function getLatestPublishedQuickPostByType(type: "NORMAL" | "QUOTE") {
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
