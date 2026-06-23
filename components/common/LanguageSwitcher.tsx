"use client";

import { localeCookieName, localeLabels, locales, type Locale, withLocale } from "@/lib/i18n/config";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type LanguageSwitcherProps = {
  currentLocale: Locale;
};

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  function switchLocale(locale: Locale) {
    document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    const query = searchParams.toString();
    const currentPath = pathname || "/";
    const nextPath = currentPath.startsWith("/admin")
      ? currentPath
      : withLocale(currentPath, locale);
    router.push(query ? `${nextPath}?${query}` : nextPath);
    router.refresh();
  }

  return (
    <div className="inline-flex rounded-full border border-outline-variant/25 bg-surface-container-lowest/70 p-1">
      {locales.map((locale) => {
        const active = locale === currentLocale;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => switchLocale(locale)}
            className={`h-8 min-w-10 rounded-full px-3 text-[11px] font-black tracking-widest transition-all ${
              active
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:bg-secondary/10 hover:text-primary"
            }`}
            aria-pressed={active}
          >
            {localeLabels[locale]}
          </button>
        );
      })}
    </div>
  );
}
