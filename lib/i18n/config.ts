export const locales = ["en", "id"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "id";
export const localeCookieName = "BRH_LOCALE";

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  id: "ID",
};

export const localeNames: Record<Locale, string> = {
  en: "English",
  id: "Indonesia",
};

const localizedRouteGroups = [
  { id: "/tentang", en: "/about", aliases: ["/biografi"] },
  { id: "/publikasi", en: "/publications", aliases: [] },
  { id: "/riset", en: "/research", aliases: [] },
  { id: "/pengabdian", en: "/engagement", aliases: [] },
  { id: "/kontak", en: "/contact", aliases: [] },
] as const;

export function hasLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function stripLocale(pathname: string) {
  const parts = pathname.split("/");
  const maybeLocale = parts[1];
  if (hasLocale(maybeLocale)) {
    const stripped = `/${parts.slice(2).join("/")}`;
    return stripped === "/" ? "/" : stripped.replace(/\/$/, "") || "/";
  }
  return pathname || "/";
}

export function withLocale(pathname: string, locale: Locale) {
  const stripped = stripLocale(pathname);
  const route = localizedRouteGroups.find((item) => {
    const bases: readonly string[] = [item.id, item.en, ...item.aliases];
    return bases.some((base) => stripped === base || stripped.startsWith(`${base}/`));
  });
  let localizedPath = stripped;

  if (route) {
    const bases: readonly string[] = [route.id, route.en, ...route.aliases];
    const matchingBase = bases.find((base) => stripped === base || stripped.startsWith(`${base}/`));
    const suffix = matchingBase ? stripped.slice(matchingBase.length) : "";
    localizedPath = `${locale === "id" ? route.id : route.en}${suffix}`;
  }

  if (locale === "id") return localizedPath;
  return localizedPath === "/" ? "/en" : `/en${localizedPath}`;
}

export function getDateLocale(locale: Locale) {
  return locale === "id" ? "id-ID" : "en-US";
}

export function formatLocalizedDate(
  value: Date | string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
) {
  return new Date(value).toLocaleDateString(getDateLocale(locale), options);
}
