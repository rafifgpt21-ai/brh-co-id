export const locales = ["en", "id"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "BRH_LOCALE";

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  id: "ID",
};

export const localeNames: Record<Locale, string> = {
  en: "English",
  id: "Indonesia",
};

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
  return stripped === "/" ? `/${locale}` : `/${locale}${stripped}`;
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
