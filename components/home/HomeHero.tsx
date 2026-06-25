'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLenis } from 'lenis/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
    };

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
  quoteAuthor?: string;
  latestShort?: string;
};

function truncateText(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit).trim()}...` : value;
}

function getQuoteFontSize(value: string) {
  if (value.length > 180) return "clamp(0.95rem, 1.8vw, 1.12rem)";
  if (value.length > 130) return "clamp(1rem, 2vw, 1.28rem)";
  if (value.length > 80) return "clamp(1.1rem, 2.25vw, 1.45rem)";
  return "clamp(1.2rem, 2.55vw, 1.65rem)";
}

function getHeroPanelDisplay({
  item,
  lang,
  labels,
}: {
  item: HeroPanelItem;
  lang: Locale;
  labels: HeroPanelLabels;
}) {
  if (item.kind === "article") {
    return {
      label: labels.latestReading,
      meta: `${item.category} / ${formatLocalizedDate(item.createdAt, lang)}`,
      headline: item.title,
      body: item.excerpt,
      imageUrl: item.thumbnail,
      href: item.href,
      actionIcon: "east",
      icon: "menu_book",
      tone: "article",
    } as const;
  }

  if (item.kind === "quote") {
    return {
      label: labels.quoteOfTheDay,
      meta: formatLocalizedDate(item.createdAt, lang),
      headline: `"${truncateText(item.content, 210)}"`,
      body: "",
      imageUrl: null,
      href: null,
      actionIcon: "south",
      icon: "format_quote",
      tone: "quote",
    } as const;
  }

  return {
    label: labels.insight,
    meta: formatLocalizedDate(item.createdAt, lang),
    headline: truncateText(item.content, 260),
    body: "",
    imageUrl: item.imageUrl,
    href: null,
    actionIcon: "south",
    icon: "lightbulb",
    tone: "insight",
  } as const;
}

export default function HomeHero({
  lang,
  home,
  search,
  heroPanelItems,
  heroPanelLabels,
}: {
  lang: Locale;
  home: HomeCopy;
  search: Dictionary["search"];
  heroPanelItems: HeroPanelItem[];
  heroPanelLabels: HeroPanelLabels;
}) {
  const lenis = useLenis();
  const shouldReduceMotion = useReducedMotion();
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [isPanelPaused, setIsPanelPaused] = useState(false);
  const visiblePanelItems = useMemo(() => heroPanelItems.filter(Boolean), [heroPanelItems]);
  const safeActivePanelIndex = visiblePanelItems.length > 0 ? activePanelIndex % visiblePanelItems.length : 0;
  const heroPanelItem = visiblePanelItems[safeActivePanelIndex] ?? null;
  const panelDisplay = heroPanelItem
    ? getHeroPanelDisplay({ item: heroPanelItem, lang, labels: heroPanelLabels })
    : null;
  const hasMultiplePanelItems = visiblePanelItems.length > 1;

  useEffect(() => {
    if (!hasMultiplePanelItems || isPanelPaused) return;

    const interval = window.setInterval(() => {
      setActivePanelIndex((current) => (current + 1) % visiblePanelItems.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [hasMultiplePanelItems, isPanelPaused, visiblePanelItems.length]);

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

  return (
    <motion.section
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ opacity: 1 }}
      className="relative border-b border-outline-variant/30 bg-surface px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 md:px-12 md:pb-12 md:pt-10 lg:px-24 lg:pb-16"
    >
      <div className="mx-auto grid max-w-7xl gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.62fr)] lg:items-end lg:gap-10">
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-black uppercase tracking-[0.2em] text-secondary sm:mb-7 sm:text-[11px] sm:tracking-[0.24em] md:mb-8">
            <span>BRH Intellectual</span>
            <span className="hidden h-px w-10 bg-outline/45 sm:block" />
            <span className="hidden sm:inline">{home.heroLabel}</span>
          </div>

          <h1 className="max-w-5xl text-pretty font-headline text-[2.05rem] font-black leading-[1.04] tracking-tight text-primary xs:text-4xl sm:text-5xl md:text-6xl lg:text-[4.45rem]">
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
              className="tap-target inline-flex min-w-0 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-black text-on-primary transition hover:bg-tertiary active:scale-[0.98] sm:px-6"
            >
              <span className="material-symbols-outlined text-[19px]">travel_explore</span>
              <span className="truncate">{home.mobileExplore}</span>
            </Link>
            <button
              type="button"
              onClick={scrollToLatest('#arsip')}
              className="tap-target inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-outline-variant/60 bg-surface px-4 text-sm font-black text-primary transition hover:border-secondary hover:bg-surface-container-low active:scale-[0.98] sm:px-6"
            >
              <span className="material-symbols-outlined text-[19px]">south</span>
              <span className="hidden sm:inline">{home.archiveTitleA} {home.archiveTitleB}</span>
              <span className="sm:hidden">{home.latestShort ?? home.archiveTitleA}</span>
            </button>
          </div>
        </div>

        <aside
          className="border-l-0 border-outline-variant/40 pt-1 sm:pt-2 lg:border-l lg:pl-10"
          onMouseEnter={() => setIsPanelPaused(true)}
          onMouseLeave={() => setIsPanelPaused(false)}
          onFocus={() => setIsPanelPaused(true)}
          onBlur={() => setIsPanelPaused(false)}
        >
          <div className="flex h-[320px] flex-col overflow-hidden rounded-lg border border-outline-variant/35 bg-surface-container-lowest/70 p-4 shadow-[0_18px_55px_rgba(41,47,54,0.06)] sm:h-[320px] sm:p-5 md:h-[340px] lg:h-[360px]">
            {panelDisplay && heroPanelItem ? (
              <>
                <div className="relative min-h-0 flex-1">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={`${heroPanelItem.kind}-${heroPanelItem.id}`}
                      initial={{
                        opacity: 0,
                        x: shouldReduceMotion ? 0 : 12,
                        y: shouldReduceMotion ? 0 : 8,
                      }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      exit={{
                        opacity: 0,
                        x: shouldReduceMotion ? 0 : -10,
                        y: shouldReduceMotion ? 0 : -6,
                      }}
                      transition={{ duration: shouldReduceMotion ? 0.12 : 0.34, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0"
                    >
                      {panelDisplay.href ? (
                        <Link
                          href={panelDisplay.href}
                          className="group flex h-full flex-col text-left outline-none"
                        >
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-secondary sm:gap-3 sm:text-[11px] sm:tracking-[0.22em]">
                            <span className="shrink-0">{panelDisplay.label}</span>
                            <span className="h-px flex-1 bg-outline-variant" />
                            <span className="max-w-[48%] truncate tracking-normal text-on-surface-variant/55">
                              {panelDisplay.meta}
                            </span>
                          </div>

                          <div className="mt-4 min-h-0 flex-1">
                            <h2 className="line-clamp-2 text-pretty font-headline text-xl font-black leading-tight text-tertiary transition group-hover:text-primary sm:text-2xl">
                              {panelDisplay.headline}
                            </h2>
                            {panelDisplay.body && (
                              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-on-surface-variant/75">
                                {panelDisplay.body}
                              </p>
                            )}
                          </div>

                          <div className="mt-4 grid shrink-0 grid-cols-[82px_minmax(0,1fr)] items-end gap-3 sm:grid-cols-[98px_minmax(0,1fr)]">
                            <div className="relative h-16 overflow-hidden rounded-md bg-surface-container sm:h-20">
                              {panelDisplay.imageUrl ? (
                                <Image
                                  src={panelDisplay.imageUrl}
                                  alt=""
                                  fill
                                  sizes="120px"
                                  className="object-cover transition duration-700 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <span className="material-symbols-outlined text-3xl text-secondary/35">
                                    {panelDisplay.icon}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="mb-1 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-secondary sm:text-xs">
                              {home.readMore}
                              <span className="material-symbols-outlined text-[17px] transition group-hover:translate-x-1">
                                {panelDisplay.actionIcon}
                              </span>
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={scrollToLatest('#notes')}
                          className="group flex h-full w-full flex-col text-left outline-none"
                        >
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-secondary sm:gap-3 sm:text-[11px] sm:tracking-[0.22em]">
                            <span className="shrink-0">{panelDisplay.label}</span>
                            <span className="h-px flex-1 bg-outline-variant" />
                            <span className="max-w-[48%] truncate tracking-normal text-on-surface-variant/55">
                              {panelDisplay.meta}
                            </span>
                          </div>

                          <div className="mt-4 flex min-h-0 flex-1 flex-col justify-center">
                            {panelDisplay.tone === "quote" ? (
                              <figure className="flex min-h-0 flex-1 flex-col justify-center">
                                <blockquote
                                  className="line-clamp-6 text-pretty font-headline font-black italic leading-[1.16] text-tertiary transition group-hover:text-primary"
                                  style={{ fontSize: getQuoteFontSize(panelDisplay.headline) }}
                                >
                                  {panelDisplay.headline}
                                </blockquote>
                                <figcaption className="mt-3 font-label text-[10px] font-black uppercase tracking-[0.28em] text-secondary sm:text-[11px]">
                                  {home.quoteAuthor ?? "-BRH-"}
                                </figcaption>
                              </figure>
                            ) : (
                              <p className="line-clamp-5 text-pretty font-body text-lg font-semibold leading-relaxed text-on-surface transition group-hover:text-primary sm:text-xl">
                                {panelDisplay.headline}
                              </p>
                            )}
                          </div>

                          {panelDisplay.tone === "quote" ? (
                            <span className="mt-4 inline-flex shrink-0 items-center gap-2 text-[11px] font-black uppercase tracking-widest text-secondary sm:text-xs">
                              {home.readMore}
                              <span className="material-symbols-outlined text-[20px] transition group-hover:translate-y-0.5">
                                {panelDisplay.actionIcon}
                              </span>
                            </span>
                          ) : (
                            <div className="mt-4 grid shrink-0 grid-cols-[82px_minmax(0,1fr)] items-end gap-3 sm:grid-cols-[98px_minmax(0,1fr)]">
                              <div className="relative h-16 overflow-hidden rounded-md bg-surface-container sm:h-20">
                                {panelDisplay.imageUrl ? (
                                  <Image
                                    src={panelDisplay.imageUrl}
                                    alt=""
                                    fill
                                    sizes="120px"
                                    className="object-cover transition duration-700 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-secondary/35">
                                      {panelDisplay.icon}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <span className="mb-1 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-secondary sm:text-xs">
                                {home.readMore}
                                <span className="material-symbols-outlined text-[17px] transition group-hover:translate-y-0.5">
                                  {panelDisplay.actionIcon}
                                </span>
                              </span>
                            </div>
                          )}
                        </button>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {hasMultiplePanelItems && (
                  <div className="mt-4 flex shrink-0 items-center gap-2">
                    {visiblePanelItems.map((item, index) => {
                      const label =
                        item.kind === "quote"
                          ? heroPanelLabels.quoteOfTheDay
                          : item.kind === "insight"
                            ? heroPanelLabels.insight
                            : heroPanelLabels.latestReading;

                      return (
                        <button
                          key={`${item.kind}-${item.id}`}
                          type="button"
                          onClick={() => setActivePanelIndex(index)}
                          className={`h-2.5 rounded-full transition ${
                            index === safeActivePanelIndex
                              ? "w-8 bg-secondary"
                              : "w-2.5 bg-outline-variant hover:bg-secondary/55"
                          }`}
                          aria-label={label}
                          aria-current={index === safeActivePanelIndex}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full flex-col justify-center">
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
          </div>
        </aside>
      </div>
    </motion.section>
  );
}
