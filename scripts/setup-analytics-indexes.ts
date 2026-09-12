import "dotenv/config";

import { prisma } from "@/lib/prisma";

async function main() {
  const pageViewResult = await prisma.$runCommandRaw({
    createIndexes: "AnalyticsPageView",
    indexes: [
      { key: { eventId: 1 }, name: "AnalyticsPageView_eventId_key", unique: true },
      { key: { dedupeKey: 1 }, name: "AnalyticsPageView_dedupeKey_key", unique: true },
      { key: { occurredAt: 1 }, name: "AnalyticsPageView_occurredAt_idx" },
      { key: { pageKey: 1, occurredAt: 1 }, name: "AnalyticsPageView_pageKey_occurredAt_idx" },
      { key: { visitorHash: 1, occurredAt: 1 }, name: "AnalyticsPageView_visitorHash_occurredAt_idx" },
      { key: { sessionHash: 1, occurredAt: 1 }, name: "AnalyticsPageView_sessionHash_occurredAt_idx" },
      { key: { source: 1, occurredAt: 1 }, name: "AnalyticsPageView_source_occurredAt_idx" },
      {
        key: { expiresAt: 1 },
        name: "analytics_page_view_ttl",
        expireAfterSeconds: 0,
      },
    ],
  });
  const pageTotalResult = await prisma.$runCommandRaw({
    createIndexes: "AnalyticsPageTotal",
    indexes: [
      { key: { pageKey: 1 }, name: "AnalyticsPageTotal_pageKey_key", unique: true },
      { key: { pageType: 1 }, name: "AnalyticsPageTotal_pageType_idx" },
      { key: { contentId: 1 }, name: "AnalyticsPageTotal_contentId_idx" },
      { key: { totalViews: 1 }, name: "AnalyticsPageTotal_totalViews_idx" },
    ],
  });
  console.log("Analytics indexes are ready.", { pageViewResult, pageTotalResult });
}

main()
  .catch((error) => {
    console.error("Failed to prepare analytics indexes.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
