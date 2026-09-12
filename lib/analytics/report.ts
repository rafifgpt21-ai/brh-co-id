import "server-only";

import { getStaticPageLabel } from "@/lib/analytics/shared";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const WIB_TIMEZONE = "Asia/Jakarta";
const MAX_RANGE_DAYS = 396;
const PRESETS = new Set([7, 30, 90, 365]);
const PAGE_TYPES = new Set(["all", "home", "static", "listing", "viewer", "post", "quote"]);

export type AnalyticsFilters = {
  from: string;
  to: string;
  preset: string;
  locale: "all" | "id" | "en";
  pageType: string;
  error: string | null;
};

export type AnalyticsReport = {
  filters: AnalyticsFilters;
  summary: { views: number; visitors: number; sessions: number; viewsPerSession: number };
  comparison: { views: number; visitors: number; sessions: number; viewsPerSession: number };
  trend: Array<{ date: string; views: number; visitors: number }>;
  topPages: Array<{ pageKey: string; title: string; path: string; pageType: string; views: number; visitors: number }>;
  sources: Array<{ value: string; count: number }>;
  referrers: Array<{ value: string; count: number }>;
  campaigns: Array<{ value: string; count: number }>;
  devices: Array<{ value: string; count: number }>;
  browsers: Array<{ value: string; count: number }>;
  locales: Array<{ value: string; count: number }>;
};

type RawRow = Record<string, unknown>;

function jakartaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shiftDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function startOfWibDay(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+07:00`);
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function resolveAnalyticsFilters(query: Record<string, string | string[] | undefined>): AnalyticsFilters {
  const today = jakartaToday();
  const rawPreset = typeof query.preset === "string" ? query.preset : "30";
  const presetDays = PRESETS.has(Number(rawPreset)) ? Number(rawPreset) : 30;
  const locale = query.locale === "id" || query.locale === "en" ? query.locale : "all";
  const pageType = typeof query.type === "string" && PAGE_TYPES.has(query.type) ? query.type : "all";
  let from = shiftDateKey(today, -(presetDays - 1));
  let to = today;
  let preset = String(presetDays);
  let error: string | null = null;

  if (rawPreset === "custom") {
    if (isDateKey(query.from) && isDateKey(query.to)) {
      const start = startOfWibDay(query.from);
      const end = startOfWibDay(query.to);
      const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
      if (days > 0 && days <= MAX_RANGE_DAYS && end <= startOfWibDay(today)) {
        from = query.from;
        to = query.to;
        preset = "custom";
      } else {
        error = "Rentang tanggal harus 1–396 hari dan tidak boleh melewati hari ini.";
      }
    } else {
      error = "Tanggal awal dan akhir tidak valid.";
    }
  }

  return { from, to, preset, locale, pageType, error };
}

function mongoDate(date: Date): Prisma.InputJsonObject {
  return { $date: date.toISOString() };
}

function rows(value: unknown) {
  return Array.isArray(value) ? (value as RawRow[]) : [];
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function buildMatch(filters: AnalyticsFilters, start: Date, end: Date): Prisma.InputJsonObject {
  return {
    occurredAt: { $gte: mongoDate(start), $lt: mongoDate(end) },
    ...(filters.locale !== "all" ? { locale: filters.locale } : {}),
    ...(filters.pageType !== "all" ? { pageType: filters.pageType } : {}),
  };
}

async function summaryFor(match: Prisma.InputJsonObject) {
  const result = await prisma.analyticsPageView.aggregateRaw({
    pipeline: [
      { $match: match },
      {
        $facet: {
          views: [{ $count: "value" }],
          visitors: [{ $group: { _id: "$visitorHash" } }, { $count: "value" }],
          sessions: [{ $group: { _id: "$sessionHash" } }, { $count: "value" }],
        },
      },
    ],
  });
  const resultRows = rows(result);
  const facet = (resultRows[0] || {}) as Record<string, unknown>;
  const views = numberValue(rows(facet.views)[0]?.value);
  const visitors = numberValue(rows(facet.visitors)[0]?.value);
  const sessions = numberValue(rows(facet.sessions)[0]?.value);
  return { views, visitors, sessions, viewsPerSession: sessions ? views / sessions : 0 };
}

async function groupedCounts(match: Prisma.InputJsonObject, field: string, limit = 12) {
  const result = await prisma.analyticsPageView.aggregateRaw({
    pipeline: [
      { $match: { ...match, [field]: { $nin: [null, ""] } } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ],
  });
  return rows(result).map((row) => ({ value: String(row._id || "unknown"), count: numberValue(row.count) }));
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function resolveTopPageTitles(topPages: AnalyticsReport["topPages"]) {
  const postIds = topPages.filter((page) => page.pageKey.startsWith("post:")).map((page) => page.pageKey.slice(5));
  const quoteIds = topPages.filter((page) => page.pageKey.startsWith("quote:")).map((page) => page.pageKey.slice(6));
  const [posts, quotes] = await Promise.all([
    postIds.length ? prisma.post.findMany({ where: { id: { in: postIds } }, select: { id: true, title: true } }) : [],
    quoteIds.length ? prisma.quickPost.findMany({ where: { id: { in: quoteIds } }, select: { id: true, content: true } }) : [],
  ]);
  const labels = new Map<string, string>();
  posts.forEach((post) => labels.set(`post:${post.id}`, post.title));
  quotes.forEach((quote) => labels.set(`quote:${quote.id}`, `“${stripHtml(quote.content).slice(0, 72)}${quote.content.length > 72 ? "…" : ""}”`));
  return topPages.map((page) => ({
    ...page,
    title: labels.get(page.pageKey) || getStaticPageLabel(page.pageKey) || (page.pageKey.startsWith("page:") ? page.path : "Konten dihapus"),
  }));
}

export async function getAnalyticsReport(filters: AnalyticsFilters): Promise<AnalyticsReport> {
  const start = startOfWibDay(filters.from);
  const end = startOfWibDay(shiftDateKey(filters.to, 1));
  const duration = end.getTime() - start.getTime();
  const previousStart = new Date(start.getTime() - duration);
  const match = buildMatch(filters, start, end);
  const comparisonMatch = buildMatch(filters, previousStart, start);

  const [summary, comparison, trendRaw, topRaw, sources, referrers, campaigns, devices, browsers, locales] = await Promise.all([
    summaryFor(match),
    summaryFor(comparisonMatch),
    prisma.analyticsPageView.aggregateRaw({
      pipeline: [
        { $match: match },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt", timezone: WIB_TIMEZONE } }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorHash" } } },
        { $project: { _id: 1, views: 1, visitors: { $size: "$visitors" } } },
        { $sort: { _id: 1 } },
      ],
    }),
    prisma.analyticsPageView.aggregateRaw({
      pipeline: [
        { $match: match },
        { $sort: { occurredAt: 1 } },
        { $group: { _id: "$pageKey", path: { $last: "$canonicalPath" }, pageType: { $last: "$pageType" }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorHash" } } },
        { $project: { _id: 1, path: 1, pageType: 1, views: 1, visitors: { $size: "$visitors" } } },
        { $sort: { views: -1 } },
        { $limit: 20 },
      ],
    }),
    groupedCounts(match, "source"),
    groupedCounts(match, "referrerHost"),
    groupedCounts(match, "utmSource"),
    groupedCounts(match, "deviceType"),
    groupedCounts(match, "browser"),
    groupedCounts(match, "locale"),
  ]);

  const trendByDate = new Map(rows(trendRaw).map((row) => [String(row._id), { views: numberValue(row.views), visitors: numberValue(row.visitors) }]));
  const trend: AnalyticsReport["trend"] = [];
  for (let date = filters.from; date <= filters.to; date = shiftDateKey(date, 1)) {
    trend.push({ date, ...(trendByDate.get(date) || { views: 0, visitors: 0 }) });
  }
  const topPages = rows(topRaw).map((row) => {
    return {
      pageKey: String(row._id || "unknown"),
      title: "",
      path: String(row.path || "/"),
      pageType: String(row.pageType || "unknown"),
      views: numberValue(row.views),
      visitors: numberValue(row.visitors),
    };
  });

  return {
    filters,
    summary,
    comparison,
    trend,
    topPages: await resolveTopPageTitles(topPages),
    sources,
    referrers,
    campaigns,
    devices,
    browsers,
    locales,
  };
}

export async function getLifetimeViewCount(pageKey: string) {
  return (await prisma.analyticsPageTotal.findUnique({ where: { pageKey }, select: { totalViews: true } }))?.totalViews || 0;
}
