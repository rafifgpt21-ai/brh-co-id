import {
  hasLocale,
  localeCookieName,
} from "@/lib/i18n/config";
import { NextResponse, type NextRequest } from "next/server";

function setLocaleCookie(response: NextResponse, locale: "en" | "id") {
  response.cookies.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const redirects: Record<string, string> = {
    "/biografi": "/tentang",
    "/en/biografi": "/en/about",
    "/en/tentang": "/en/about",
    "/about": "/tentang",
    "/en/publikasi": "/en/publications",
    "/publications": "/publikasi",
    "/en/riset": "/en/research",
    "/research": "/riset",
    "/engagement": "/pengabdian",
    "/en/pengabdian": "/en/engagement",
    "/contact": "/kontak",
    "/en/kontak": "/en/contact",
    "/catatan/pandangan": "/pengabdian",
    "/en/catatan/pandangan": "/en/engagement",
  };
  const redirectTarget = redirects[pathname];
  if (redirectTarget) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTarget;
    return NextResponse.redirect(url, 308);
  }

  const locale = pathname.split("/")[1];
  if (locale === "id") {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/id(?=\/|$)/, "") || "/";
    return setLocaleCookie(NextResponse.redirect(url, 308), "id");
  }

  if (hasLocale(locale)) {
    return setLocaleCookie(NextResponse.next(), locale);
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/id" : `/id${pathname}`;
  return setLocaleCookie(NextResponse.rewrite(url), "id");
}

export { proxy as middleware, proxy as default };

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|logo.png|sitemap.xml|robots.txt|opengraph-image|.*\\..*).*)",
  ],
};
