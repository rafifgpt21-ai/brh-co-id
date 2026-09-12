import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  ANALYTICS_DEDUPE_MS,
  classifyTrafficSource,
  parseReferrer,
  parseUserAgent,
  resolveTrackedPageCandidate,
  type AnalyticsLocale,
} from "@/lib/analytics/shared";

export type ResolvedTrackedPage = {
  pageKey: string;
  pathname: string;
  canonicalPath: string;
  pageType: string;
  contentId: string | null;
  locale: AnalyticsLocale;
};

export function isAnalyticsEnabled() {
  return process.env.ANALYTICS_ENABLED === "true";
}

function getSecret() {
  const secret = process.env.ANALYTICS_HASH_SECRET;
  if (!secret) throw new Error("ANALYTICS_HASH_SECRET is required when analytics is enabled.");
  return secret;
}

export function hashAnalyticsValue(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export async function resolveTrackedPage(pathname: string): Promise<ResolvedTrackedPage | null> {
  const candidate = resolveTrackedPageCandidate(pathname);
  if (!candidate) return null;
  if (candidate.kind === "static") {
    return {
      pageKey: candidate.pageKey,
      pathname: candidate.pathname,
      canonicalPath: candidate.canonicalPath,
      pageType: candidate.pageType,
      contentId: null,
      locale: candidate.locale,
    };
  }
  if (candidate.kind === "post") {
    const post = await prisma.post.findFirst({
      where: { status: "Published", OR: [{ slug: candidate.slug }, { slugEn: candidate.slug }] },
      select: { id: true, slug: true },
    });
    return post
      ? {
          pageKey: `post:${post.id}`,
          pathname: candidate.pathname,
          canonicalPath: `/post/${post.slug}`,
          pageType: "post",
          contentId: post.id,
          locale: candidate.locale,
        }
      : null;
  }
  const quote = await prisma.quickPost.findFirst({
    where: { id: candidate.id, status: "Published", type: "QUOTE" },
    select: { id: true },
  });
  return quote
    ? {
        pageKey: `quote:${quote.id}`,
        pathname: candidate.pathname,
        canonicalPath: `/catatan/kutipan/${quote.id}`,
        pageType: "quote",
        contentId: quote.id,
        locale: candidate.locale,
      }
    : null;
}

function addThirteenMonths(date: Date) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + 13);
  return result;
}

export async function recordPageView(input: {
  eventId: string;
  page: ResolvedTrackedPage;
  visitorId: string;
  sessionId: string;
  referrer: unknown;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  userAgent: string;
  appHosts: Set<string>;
}) {
  const now = new Date();
  const visitorHash = hashAnalyticsValue(input.visitorId);
  const sessionHash = hashAnalyticsValue(input.sessionId);
  const dedupeBucket = Math.floor(now.getTime() / ANALYTICS_DEDUPE_MS);
  const dedupeKey = hashAnalyticsValue(`${input.sessionId}:${input.page.pageKey}:${dedupeBucket}`);
  const referrer = parseReferrer(input.referrer, input.appHosts);
  const source = classifyTrafficSource(referrer.referrerHost, input.utmSource, input.appHosts);
  const device = parseUserAgent(input.userAgent);

  await prisma.$transaction(async (tx) => {
    await tx.analyticsPageView.create({
      data: {
        eventId: input.eventId,
        dedupeKey,
        occurredAt: now,
        expiresAt: addThirteenMonths(now),
        pageKey: input.page.pageKey,
        pathname: input.page.pathname,
        canonicalPath: input.page.canonicalPath,
        pageType: input.page.pageType,
        contentId: input.page.contentId,
        locale: input.page.locale,
        visitorHash,
        sessionHash,
        referrerHost: referrer.referrerHost,
        referrerPath: referrer.referrerPath,
        source,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        ...device,
      },
    });
    await tx.analyticsPageTotal.upsert({
      where: { pageKey: input.page.pageKey },
      create: {
        pageKey: input.page.pageKey,
        pageType: input.page.pageType,
        contentId: input.page.contentId,
        canonicalPath: input.page.canonicalPath,
        totalViews: 1,
        firstViewedAt: now,
        lastViewedAt: now,
      },
      update: {
        pageType: input.page.pageType,
        contentId: input.page.contentId,
        canonicalPath: input.page.canonicalPath,
        totalViews: { increment: 1 },
        lastViewedAt: now,
      },
    });
  });
}

export function createAnonymousId() {
  return randomUUID();
}
