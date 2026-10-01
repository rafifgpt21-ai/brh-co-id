import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getPublicQuickPostsByType(options: { limitPerType?: number; upcomingAgendaOnly?: boolean } = {}) {
  "use cache";
  cacheTag("quick-posts");
  cacheLife({ stale: 60, revalidate: 300, expire: 600 });
  const now = new Date();
  const take = options.limitPerType ?? 60;
  const [quote, upcoming, past] = await Promise.all([
    prisma.quickPost.findMany({ where: { status: "Published", type: "QUOTE" }, orderBy: { createdAt: "desc" }, take }),
    prisma.quickPost.findMany({ where: { status: "Published", type: "AGENDA", startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take }),
    options.upcomingAgendaOnly ? [] : prisma.quickPost.findMany({ where: { status: "Published", type: "AGENDA", startsAt: { lt: now } }, orderBy: { startsAt: "desc" }, take }),
  ]);
  return { NORMAL: [], AGENDA: [...upcoming, ...past], QUOTE: quote };
}
