"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
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
    router.prefetch(`/${lang}/explore`);
  }, [lang, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(() => {
      const href = query.trim()
        ? `/${lang}/explore?search=${encodeURIComponent(query.trim())}`
        : `/${lang}/explore`;
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
        <div className="relative flex items-center gap-2 rounded-full border border-outline-variant/35 bg-surface-container-lowest px-1.5 py-1.5 shadow-[0_10px_30px_rgba(41,47,54,0.08)] transition group-focus-within:border-secondary/55 group-focus-within:bg-surface group-focus-within:shadow-[0_16px_40px_rgba(41,47,54,0.11),0_0_0_4px_rgba(177,29,20,0.08)] md:gap-3 md:px-2 md:py-2">
          <div className="flex flex-1 items-center gap-2 pl-3 md:gap-4 md:pl-5">
            <span className={`material-symbols-outlined text-[20px] transition-colors md:text-[23px] ${isPending ? "animate-spin text-secondary" : "text-on-surface-variant/45 group-focus-within:text-secondary"}`}>
              {isPending ? "sync" : "search"}
            </span>
            <input
              className="hero-search-input w-full min-w-0 appearance-none border-0 bg-transparent py-2 font-body text-base font-semibold leading-6 text-primary outline-none ring-0 placeholder:font-medium placeholder:text-on-surface-variant/40 md:text-lg"
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
            className="tap-target flex shrink-0 items-center justify-center rounded-full bg-primary p-2.5 text-on-primary shadow-md shadow-primary/15 transition hover:bg-tertiary active:scale-95 disabled:cursor-not-allowed disabled:opacity-55 md:p-3.5"
            aria-label="Search"
          >
            <span className="material-symbols-outlined text-[20px] md:text-[22px]">search</span>
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap justify-start gap-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-on-surface-variant/45 md:mt-4 md:gap-4 md:text-[10px]">
        <span>{labels.trending}</span>
        <button onClick={() => setQuery("Tasawuf")} className="hover:text-secondary transition-colors">Tasawuf</button>
        <button onClick={() => setQuery("Pendidikan")} className="hover:text-secondary transition-colors">Pendidikan</button>
      </div>
    </div>
  );
}
