"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { withLocale, type Locale } from "@/lib/i18n/config";
import { useNavigationFeedback } from "@/components/navigation/NavigationFeedback";

export default function HeroSearch({
  lang,
  labels,
}: {
  lang: Locale;
  labels: { placeholder: string; trending: string };
}) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { startNavigation } = useNavigationFeedback();

  useEffect(() => {
    router.prefetch(withLocale("/explore", lang));
  }, [lang, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(() => {
      const href = query.trim()
        ? `${withLocale("/explore", lang)}?search=${encodeURIComponent(query.trim())}`
        : withLocale("/explore", lang);
      startNavigation(href);
      if (query.trim()) {
        router.push(href);
      } else {
        router.push(href);
      }
    });
  };

  return (
    <div className="group relative w-full max-w-2xl">
      <form onSubmit={handleSearch}>
        <div className="relative flex items-center gap-2 rounded-full border border-outline-variant/45 bg-surface-container-lowest px-1.5 py-1.5 shadow-[0_8px_24px_rgba(41,47,54,0.055)] transition duration-200 group-focus-within:border-secondary/50 group-focus-within:shadow-[0_12px_30px_rgba(41,47,54,0.07),0_0_0_3px_rgba(164,31,19,0.055)] md:gap-3 md:px-2 md:py-2">
          <div className="flex flex-1 items-center gap-2 pl-3 md:gap-3 md:pl-4">
            <span className={`material-symbols-outlined text-[19px] transition-colors md:text-[21px] ${isPending ? "animate-spin text-secondary" : "text-on-surface-variant/38 group-focus-within:text-secondary"}`}>
              {isPending ? "sync" : "search"}
            </span>
            <input
              className="hero-search-input w-full min-w-0 appearance-none border-0 bg-transparent py-2 font-body text-[15px] font-medium leading-6 text-tertiary outline-none ring-0 placeholder:font-normal placeholder:text-on-surface-variant/38 md:text-base"
              placeholder={labels.placeholder}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isPending}
              aria-label={labels.placeholder}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_5px_14px_rgba(164,31,19,0.16)] transition duration-200 hover:-translate-y-px hover:bg-tertiary active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 md:h-12 md:w-12"
            aria-label="Search"
          >
            <span className="material-symbols-outlined text-[19px] md:text-[20px]">search</span>
          </button>
        </div>
      </form>

      <div className="mt-2.5 flex flex-wrap justify-start gap-x-3 gap-y-2 text-[9px] font-bold uppercase tracking-[0.16em] text-on-surface-variant/38 md:mt-3 md:gap-x-4 md:text-[10px]">
        <span>{labels.trending}</span>
        <button onClick={() => setQuery("Tasawuf")} className="transition-colors hover:text-primary">Tasawuf</button>
        <button onClick={() => setQuery("Pendidikan")} className="transition-colors hover:text-primary">Pendidikan</button>
      </div>
    </div>
  );
}
