import { auth } from "@/auth";
import {
  defaultLocale,
  hasLocale,
  localeCookieName,
  type Locale,
} from "@/lib/i18n/config";
import { NextResponse, type NextRequest } from "next/server";

function getLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(localeCookieName)?.value;
  if (hasLocale(cookieLocale)) return cookieLocale;

  const accepted = request.headers.get("accept-language") || "";
  const lowerAccepted = accepted.toLowerCase();
  if (lowerAccepted.includes("id")) return "id";

  return defaultLocale;
}

const authProxy = auth((request) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const pathnameHasLocale = pathname
    .split("/")
    .filter(Boolean)
    .some((segment, index) => index === 0 && hasLocale(segment));

  if (pathnameHasLocale) {
    const locale = pathname.split("/")[1];
    const response = NextResponse.next();
    if (hasLocale(locale)) {
      response.cookies.set(localeCookieName, locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  const locale = getLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(url);
});

export { authProxy as proxy, authProxy as middleware, authProxy as default };

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|.*\\..*).*)"],
};
