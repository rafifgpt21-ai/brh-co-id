export const ANALYTICS_VISITOR_COOKIE = "brh_vid";
export const ANALYTICS_SESSION_COOKIE = "brh_sid";
export const ANALYTICS_OPTOUT_COOKIE = "brh_analytics_opt_out";
export const ANALYTICS_DEDUPE_MS = 30_000;
export const ANALYTICS_SESSION_SECONDS = 30 * 60;
export const ANALYTICS_VISITOR_SECONDS = 60 * 60 * 24 * 396;

export type AnalyticsLocale = "id" | "en";

export type TrackedPageCandidate =
  | {
      kind: "static";
      locale: AnalyticsLocale;
      pathname: string;
      pageKey: string;
      canonicalPath: string;
      pageType: string;
      label: string;
    }
  | {
      kind: "post";
      locale: AnalyticsLocale;
      pathname: string;
      slug: string;
    }
  | {
      kind: "quote";
      locale: AnalyticsLocale;
      pathname: string;
      id: string;
    };

type StaticPageDefinition = {
  key: string;
  canonicalPath: string;
  pageType: "home" | "static" | "listing" | "viewer";
  label: string;
};

const STATIC_PAGES: Record<string, StaticPageDefinition> = {
  "": { key: "home", canonicalPath: "/", pageType: "home", label: "Beranda" },
  about: { key: "about", canonicalPath: "/about", pageType: "static", label: "Tentang" },
  tentang: { key: "about", canonicalPath: "/about", pageType: "static", label: "Tentang" },
  biografi: { key: "about", canonicalPath: "/about", pageType: "static", label: "Tentang" },
  explore: { key: "explore", canonicalPath: "/explore", pageType: "listing", label: "Katalog Karya" },
  publications: { key: "publications", canonicalPath: "/publications", pageType: "listing", label: "Publikasi" },
  publikasi: { key: "publications", canonicalPath: "/publications", pageType: "listing", label: "Publikasi" },
  research: { key: "research", canonicalPath: "/research", pageType: "static", label: "Riset" },
  riset: { key: "research", canonicalPath: "/research", pageType: "static", label: "Riset" },
  engagement: { key: "engagement", canonicalPath: "/engagement", pageType: "static", label: "Pengabdian" },
  pengabdian: { key: "engagement", canonicalPath: "/engagement", pageType: "static", label: "Pengabdian" },
  contact: { key: "contact", canonicalPath: "/contact", pageType: "static", label: "Kontak" },
  kontak: { key: "contact", canonicalPath: "/contact", pageType: "static", label: "Kontak" },
  catatan: { key: "notes", canonicalPath: "/catatan", pageType: "listing", label: "Catatan" },
  "catatan/agenda": { key: "notes-agenda", canonicalPath: "/catatan/agenda", pageType: "listing", label: "Agenda" },
  "catatan/kutipan": { key: "notes-quotes", canonicalPath: "/catatan/kutipan", pageType: "listing", label: "Kutipan" },
  "media-pembelajaran": { key: "learning-media", canonicalPath: "/media-pembelajaran", pageType: "listing", label: "Media Pembelajaran" },
  "pdf-viewer": { key: "pdf-viewer", canonicalPath: "/pdf-viewer", pageType: "viewer", label: "Pembaca PDF" },
};

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

export function resolveTrackedPageCandidate(input: string): TrackedPageCandidate | null {
  if (!input.startsWith("/") || input.length > 512 || input.includes("\0")) return null;
  const pathname = input.split(/[?#]/, 1)[0].replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
  const encodedSegments = pathname.split("/").filter(Boolean);
  const locale: AnalyticsLocale = encodedSegments[0] === "en" ? "en" : "id";
  if (encodedSegments[0] === "en" || encodedSegments[0] === "id") encodedSegments.shift();
  const segments = encodedSegments.map(decodeSegment);
  if (segments.some((segment) => segment === null)) return null;
  const routeSegments = segments as string[];
  const route = routeSegments.join("/");

  const staticPage = STATIC_PAGES[route];
  if (staticPage) {
    return {
      kind: "static",
      locale,
      pathname,
      pageKey: `page:${staticPage.key}`,
      canonicalPath: staticPage.canonicalPath,
      pageType: staticPage.pageType,
      label: staticPage.label,
    };
  }

  if (routeSegments.length === 2 && routeSegments[0] === "post" && routeSegments[1]) {
    return { kind: "post", locale, pathname, slug: routeSegments[1] };
  }

  if (
    routeSegments.length === 3 &&
    routeSegments[0] === "catatan" &&
    routeSegments[1] === "kutipan" &&
    /^[a-f\d]{24}$/i.test(routeSegments[2])
  ) {
    return { kind: "quote", locale, pathname, id: routeSegments[2] };
  }

  return null;
}

export function getStaticPageLabel(pageKey: string) {
  return Object.values(STATIC_PAGES).find((page) => `page:${page.key}` === pageKey)?.label;
}

export function sanitizeAnalyticsText(value: unknown, maxLength = 100) {
  if (typeof value !== "string") return null;
  const sanitized = value.normalize("NFKC").replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return sanitized ? sanitized.slice(0, maxLength) : null;
}

export function isBotUserAgent(userAgent: string) {
  return /bot\b|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|preview|headless|lighthouse|pagespeed|monitoring/i.test(userAgent);
}

export function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  const deviceType = /ipad|tablet|kindle|silk/.test(ua)
    ? "tablet"
    : /mobile|iphone|ipod|android.*mobile/.test(ua)
      ? "mobile"
      : "desktop";
  const browser = /edg\//.test(ua)
    ? "Edge"
    : /opr\//.test(ua)
      ? "Opera"
      : /firefox\//.test(ua)
        ? "Firefox"
        : /chrome\//.test(ua)
          ? "Chrome"
          : /safari\//.test(ua)
            ? "Safari"
            : "Other";
  const os = /windows/.test(ua)
    ? "Windows"
    : /android/.test(ua)
      ? "Android"
      : /iphone|ipad|ipod/.test(ua)
        ? "iOS"
        : /mac os|macintosh/.test(ua)
          ? "macOS"
          : /linux/.test(ua)
            ? "Linux"
            : "Other";
  return { deviceType, browser, os };
}

export function classifyTrafficSource(referrerHost: string | null, utmSource: string | null, appHosts: Set<string>) {
  if (utmSource) return "campaign";
  if (!referrerHost) return "direct";
  if (appHosts.has(referrerHost)) return "internal";
  if (/google\.|bing\.|yahoo\.|duckduckgo\.|yandex\./i.test(referrerHost)) return "search";
  if (/facebook\.|instagram\.|linkedin\.|twitter\.|x\.com$|tiktok\.|youtube\.|wa\.me$|whatsapp\./i.test(referrerHost)) return "social";
  return "referral";
}

export function parseReferrer(value: unknown, appHosts: Set<string>) {
  const raw = sanitizeAnalyticsText(value, 2048);
  if (!raw) return { referrerHost: null, referrerPath: null };
  try {
    const url = new URL(raw);
    const host = url.host.toLowerCase();
    return {
      referrerHost: host.slice(0, 253),
      referrerPath: appHosts.has(host) ? url.pathname.slice(0, 512) : null,
    };
  } catch {
    return { referrerHost: null, referrerPath: null };
  }
}
