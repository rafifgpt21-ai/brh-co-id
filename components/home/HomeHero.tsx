'use client';

import { motion } from 'framer-motion';
import { useLenis } from 'lenis/react';
import Image from 'next/image';
import Link from 'next/link';
import HeroSearch from '@/components/HeroSearch';
import { formatLocalizedDate, type Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';

type HeroPanelItem =
  | {
      kind: "quote" | "insight";
      id: string;
      content: string;
      imageUrl?: string | null;
      createdAt: Date | string;
    }
  | {
      kind: "article";
      id: string;
      title: string;
      excerpt: string;
      href: string;
      category: string;
      thumbnail?: string | null;
      createdAt: Date | string;
    }
  | null;

type HeroPanelLabels = {
  quoteOfTheDay: string;
  insight: string;
  latestReading: string;
  emptyTitle: string;
  emptyDescription: string;
};

type HomeCopy = {
  heroLabel: string;
  heroTitleA: string;
  heroTitleB: string;
  heroTitleC: string;
  mobileExplore: string;
  archiveTitleA: string;
  archiveTitleB: string;
  readMore: string;
  latestShort?: string;
};

function truncateText(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit).trim()}...` : value;
}

export default function HomeHero({
  lang,
  home,
  search,
  heroPanelItem,
  heroPanelLabels,
}: {
  lang: Locale;
  home: HomeCopy;
  search: Dictionary["search"];
  heroPanelItem: HeroPanelItem;
  heroPanelLabels: HeroPanelLabels;
}) {
  const lenis = useLenis();

  const scrollToLatest = (target: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, {
        offset: -88,
        duration: 1.4,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    }
  };

  const renderPanelMeta = (label: string, date?: Date | string, category?: string) => (
    <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-secondary sm:mb-4 sm:gap-3 sm:text-[11px] sm:tracking-[0.22em]">
      <span className="shrink-0">{label}</span>
      <span className="h-px flex-1 bg-outline-variant" />
      {date && (
        <span className="max-w-[48%] truncate tracking-normal text-on-surface-variant/55 sm:max-w-none">
          {category ? `${category} / ` : ""}
          {formatLocalizedDate(date, lang)}
        </span>
      )}
    </div>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative border-b border-outline-variant/30 bg-surface px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 md:px-12 md:pb-12 md:pt-10 lg:px-24 lg:pb-16"
    >
      <div className="mx-auto grid max-w-7xl gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.62fr)] lg:items-end lg:gap-10">
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-black uppercase tracking-[0.2em] text-secondary sm:mb-7 sm:text-[11px] sm:tracking-[0.24em] md:mb-8">
            <span>BRH Intellectual</span>
            <span className="hidden h-px w-10 bg-outline/45 sm:block" />
            <span className="hidden sm:inline">{home.heroLabel}</span>
          </div>

          <h1 className="max-w-5xl text-pretty font-headline text-[2.15rem] font-black leading-[1.02] tracking-tight text-primary xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
            {home.heroTitleA}{" "}
            <span className="text-tertiary">{home.heroTitleB}</span>{" "}
            <span className="italic text-secondary">{home.heroTitleC}</span>
          </h1>

          <div className="mt-6 max-w-2xl sm:mt-8">
            <HeroSearch lang={lang} labels={search} />
          </div>

          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:mt-7 sm:flex sm:flex-row sm:gap-3">
            <Link
              href={`/${lang}/explore`}
              className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-black text-on-primary transition hover:bg-tertiary sm:px-6"
            >
              <span className="material-symbols-outlined text-[19px]">travel_explore</span>
              <span className="truncate">{home.mobileExplore}</span>
            </Link>
            <button
              type="button"
              onClick={scrollToLatest('#arsip')}
              className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-full border border-outline-variant/60 bg-surface px-4 text-sm font-black text-primary transition hover:border-secondary hover:bg-surface-container-low sm:px-6"
            >
              <span className="material-symbols-outlined text-[19px]">south</span>
              <span className="hidden sm:inline">{home.archiveTitleA} {home.archiveTitleB}</span>
              <span className="sm:hidden">{home.latestShort ?? home.archiveTitleA}</span>
            </button>
          </div>
        </div>

        <aside className="border-l-0 border-outline-variant/40 pt-1 sm:pt-2 lg:border-l lg:pl-10">
          {heroPanelItem?.kind === "quote" && (
            <button
              type="button"
              onClick={scrollToLatest('#notes')}
              className="group block w-full rounded-lg border border-outline-variant/35 bg-surface-container-lowest/60 p-4 text-left sm:border-x-0 sm:bg-transparent sm:px-0 sm:py-8"
            >
              {renderPanelMeta(heroPanelLabels.quoteOfTheDay, heroPanelItem.createdAt)}
              <p className="text-pretty font-headline text-xl font-black italic leading-tight text-tertiary transition group-hover:text-primary sm:text-2xl md:text-3xl">
                &ldquo;{truncateText(heroPanelItem.content, 150)}&rdquo;
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-secondary sm:mt-6 sm:text-xs">
                {home.readMore}
                <span className="material-symbols-outlined text-[17px] transition group-hover:translate-y-0.5">south</span>
              </span>
            </button>
          )}

          {heroPanelItem?.kind === "insight" && (
            <button
              type="button"
              onClick={scrollToLatest('#notes')}
              className="group block w-full rounded-lg border border-outline-variant/35 bg-surface-container-lowest/60 p-4 text-left sm:border-x-0 sm:bg-transparent sm:px-0 sm:py-8"
            >
              {renderPanelMeta(heroPanelLabels.insight, heroPanelItem.createdAt)}
              <p className="text-pretty font-body text-base font-semibold leading-relaxed text-on-surface transition group-hover:text-primary sm:text-xl md:text-2xl">
                {truncateText(heroPanelItem.content, 170)}
              </p>
              {heroPanelItem.imageUrl && (
                <div className="relative mt-4 aspect-16/9 overflow-hidden rounded-md bg-surface-container sm:mt-6 sm:rounded-lg">
                  <Image
                    src={heroPanelItem.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 420px"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
              )}
            </button>
          )}

          {heroPanelItem?.kind === "article" && (
            <Link
              href={heroPanelItem.href}
              className="group block w-full rounded-lg border border-outline-variant/35 bg-surface-container-lowest/60 p-4 text-left sm:border-x-0 sm:bg-transparent sm:px-0 sm:py-8"
            >
              {renderPanelMeta(heroPanelLabels.latestReading, heroPanelItem.createdAt, heroPanelItem.category)}
              <h2 className="text-pretty font-headline text-xl font-black leading-tight text-tertiary transition group-hover:text-primary sm:text-2xl md:text-3xl">
                {heroPanelItem.title}
              </h2>
              {heroPanelItem.excerpt && (
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-on-surface-variant/75 sm:mt-4 sm:line-clamp-3 sm:text-base">
                  {heroPanelItem.excerpt}
                </p>
              )}
              {heroPanelItem.thumbnail && (
                <div className="relative mt-4 aspect-16/9 overflow-hidden rounded-md bg-surface-container sm:mt-6 sm:rounded-lg">
                  <Image
                    src={heroPanelItem.thumbnail}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 420px"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
              )}
              <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-secondary sm:mt-6 sm:text-xs">
                {home.readMore}
                <span className="material-symbols-outlined text-[17px] transition group-hover:translate-x-1">east</span>
              </span>
            </Link>
          )}

          {!heroPanelItem && (
            <div className="rounded-lg border border-outline-variant/35 bg-surface-container-lowest/60 p-4 sm:border-x-0 sm:bg-transparent sm:px-0 sm:py-8">
              <p className="font-label text-[10px] font-black uppercase tracking-[0.2em] text-secondary sm:text-[11px] sm:tracking-[0.24em]">
                {heroPanelLabels.insight}
              </p>
              <h2 className="mt-3 font-headline text-xl font-black text-primary sm:mt-4 sm:text-2xl">
                {heroPanelLabels.emptyTitle}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant/70 sm:mt-3 sm:text-base">
                {heroPanelLabels.emptyDescription}
              </p>
            </div>
          )}
        </aside>
      </div>
    </motion.section>
  );
}
