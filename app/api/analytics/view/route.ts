import { auth } from "@/auth";
import {
  createAnonymousId,
  isAnalyticsEnabled,
  recordPageView,
  resolveTrackedPage,
} from "@/lib/analytics/server";
import {
  ANALYTICS_OPTOUT_COOKIE,
  ANALYTICS_SESSION_COOKIE,
  ANALYTICS_SESSION_SECONDS,
  ANALYTICS_VISITOR_COOKIE,
  ANALYTICS_VISITOR_SECONDS,
  isBotUserAgent,
  sanitizeAnalyticsText,
} from "@/lib/analytics/shared";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const payloadSchema = z.object({
  eventId: z.string().uuid(),
  pathname: z.string().min(1).max(512),
  referrer: z.string().max(2048).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
}).strict();

const cookieBase = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

function requestHosts(request: NextRequest) {
  const hosts = new Set<string>();
  const addHost = (host: string) => {
    const normalized = host.toLowerCase();
    hosts.add(normalized);
    const [hostname, port] = normalized.split(":");
    if (hostname === "brh.co.id") hosts.add(`www.brh.co.id${port ? `:${port}` : ""}`);
    if (hostname === "www.brh.co.id") hosts.add(`brh.co.id${port ? `:${port}` : ""}`);
  };
  addHost(new URL(request.url).host);
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) {
    try {
      addHost(new URL(configuredUrl).host);
    } catch {
      // Invalid public URL is handled elsewhere by the application's URL helpers.
    }
  }
  return hosts;
}

function hasAllowedOrigin(request: NextRequest, hosts: Set<string>) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return hosts.has(new URL(origin).host.toLowerCase());
  } catch {
    return false;
  }
}

function noContent() {
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

function clearIdentityCookies(response: NextResponse) {
  response.cookies.set(ANALYTICS_VISITOR_COOKIE, "", { ...cookieBase, httpOnly: true, maxAge: 0 });
  response.cookies.set(ANALYTICS_SESSION_COOKIE, "", { ...cookieBase, httpOnly: true, maxAge: 0 });
}

export async function POST(request: NextRequest) {
  if (!isAnalyticsEnabled()) return noContent();

  const hosts = requestHosts(request);
  if (!hasAllowedOrigin(request, hosts)) {
    return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  }

  let parsedPayload: z.infer<typeof payloadSchema>;
  try {
    parsedPayload = payloadSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Payload analytics tidak valid." }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent") || "";
  const dntEnabled = request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1";
  if (
    dntEnabled ||
    !userAgent ||
    isBotUserAgent(userAgent) ||
    request.cookies.get(ANALYTICS_OPTOUT_COOKIE)?.value === "1"
  ) {
    return noContent();
  }

  const session = await auth();
  if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") return noContent();

  const page = await resolveTrackedPage(parsedPayload.pathname);
  if (!page) return NextResponse.json({ error: "Rute publik tidak valid." }, { status: 400 });

  const visitorId = request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value || createAnonymousId();
  const sessionId = request.cookies.get(ANALYTICS_SESSION_COOKIE)?.value || createAnonymousId();

  try {
    await recordPageView({
      eventId: parsedPayload.eventId,
      page,
      visitorId,
      sessionId,
      referrer: parsedPayload.referrer,
      utmSource: sanitizeAnalyticsText(parsedPayload.utmSource),
      utmMedium: sanitizeAnalyticsText(parsedPayload.utmMedium),
      utmCampaign: sanitizeAnalyticsText(parsedPayload.utmCampaign),
      userAgent,
      appHosts: hosts,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return noContent();
    }
    console.error("Failed to record analytics page view", error);
    return NextResponse.json({ error: "Analytics sementara tidak tersedia." }, { status: 500 });
  }

  const response = noContent();
  response.cookies.set(ANALYTICS_VISITOR_COOKIE, visitorId, {
    ...cookieBase,
    httpOnly: true,
    maxAge: ANALYTICS_VISITOR_SECONDS,
  });
  response.cookies.set(ANALYTICS_SESSION_COOKIE, sessionId, {
    ...cookieBase,
    httpOnly: true,
    maxAge: ANALYTICS_SESSION_SECONDS,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  const hosts = requestHosts(request);
  if (!hasAllowedOrigin(request, hosts)) {
    return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  }
  const response = noContent();
  clearIdentityCookies(response);
  response.cookies.set(ANALYTICS_OPTOUT_COOKIE, "1", {
    ...cookieBase,
    httpOnly: false,
    maxAge: ANALYTICS_VISITOR_SECONDS,
  });
  return response;
}
