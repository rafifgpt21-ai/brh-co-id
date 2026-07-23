"use client";

import { useState, useMemo, useTransition } from "react";
import type { Post } from "@prisma/client";
import ArchiveCard from "./ArchiveCard";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { withLocale, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useNavigationFeedback } from "@/components/navigation/NavigationFeedback";

interface KatalogClientProps {
  initialPosts: Post[];
  lang: Locale;
  dict: Dictionary;
}

const categories = ["Semua", "Buku", "Jurnal", "Artikel", "Opini"];

export default function KatalogClient({ initialPosts, lang, dict }: KatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { startNavigation } = useNavigationFeedback();

  const searchFromUrl = searchParams.get("search") || "";
  const categoryFromUrl = searchParams.get("category") || "Semua";

  // Real-time input value
  const [inputValue, setInputValue] = useState(searchFromUrl);
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl);

  // Local pagination to avoid rendering too many items
  const [displayLimit, setDisplayLimit] = useState(12);

  const handleSearchCommit = (e?: React.FormEvent, nextValue = inputValue) => {
    e?.preventDefault();
    const committedValue = nextValue.trim();

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (committedValue) {
        params.set("search", committedValue);
      } else {
        params.delete("search");
      }
      const query = params.toString();
      const href = query ? `${withLocale("/explore", lang)}?${query}` : withLocale("/explore", lang);
      startNavigation(href);
      router.replace(href, { scroll: false });
    });
  };

  const handleSuggestedKeyword = (keyword: string) => {
    setInputValue(keyword);
    setDisplayLimit(12);
    handleSearchCommit(undefined, keyword);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (category !== "Semua") {
        params.set("category", category);
      } else {
        params.delete("category");
      }
      const query = params.toString();
      const href = query ? `${withLocale("/explore", lang)}?${query}` : withLocale("/explore", lang);
      startNavigation(href);
      router.replace(href, { scroll: false });
    });
  };

  const handleReset = () => {
    setInputValue("");
    setActiveCategory("Semua");
    setDisplayLimit(12);
    startTransition(() => {
      const href = withLocale("/explore", lang);
      startNavigation(href);
      router.replace(href, { scroll: false });
    });
  };

  const filteredPosts = initialPosts; // Already filtered by server
  const visiblePosts = useMemo(() => filteredPosts.slice(0, displayLimit), [filteredPosts, displayLimit]);

  return (
    <div className="w-full bg-background">
      <section className="relative border-b border-outline-variant/25 bg-surface px-0 pb-4 pt-5 md:mb-6 md:py-16">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mb-5 flex flex-col text-left md:mb-10 md:items-center md:text-center"
          >
            <span className="font-label text-[10px] md:text-xs font-black tracking-[0.3em] text-secondary uppercase hidden md:block mb-4">{dict.explore.eyebrow}</span>
            <h1 className="font-headline text-2xl font-black tracking-tight text-primary md:mb-5 md:text-6xl">{dict.explore.title}</h1>
            <p className="mx-auto hidden max-w-2xl text-base leading-relaxed text-on-surface-variant/70 md:block md:text-lg">
              {dict.explore.intro}
            </p>
          </motion.div>

          <div className="group relative mx-auto mb-4 max-w-3xl md:mb-7 md:px-0">
            <form
              onSubmit={handleSearchCommit}
              className="relative flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-1.5 shadow-[0_10px_30px_rgba(41,47,54,0.08)] transition group-focus-within:border-secondary/50 group-focus-within:shadow-[0_16px_40px_rgba(41,47,54,0.11)] md:rounded-full md:p-2"
            >
              <div className="flex flex-1 items-center gap-3 pl-3 md:gap-4 md:pl-5">
                <span className={`material-symbols-outlined transition-colors ${isPending ? 'text-secondary animate-spin' : 'text-on-surface-variant/45 group-focus-within:text-secondary'}`}>
                  {isPending ? 'sync' : 'search'}
                </span>
                <input
                  className="w-full border-none bg-transparent font-body text-sm text-primary outline-none placeholder:text-on-surface-variant/45 md:text-base"
                  placeholder={dict.explore.searchPlaceholder}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => { setInputValue(""); }}
                    className="tap-target grid place-items-center rounded-full text-on-surface-variant/45 transition hover:bg-surface-container-high hover:text-secondary"
                    aria-label="Clear search"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="tap-target flex shrink-0 items-center justify-center rounded-lg bg-primary p-2.5 font-headline font-black text-on-primary shadow-md shadow-primary/15 transition hover:bg-tertiary active:scale-95 disabled:cursor-not-allowed disabled:opacity-55 md:rounded-full md:p-3.5"
                aria-label="Search"
              >
                <span className="material-symbols-outlined text-[18px] md:text-[24px]">search</span>
              </button>
            </form>
          </div>

          <div className="sticky top-20 z-30 -mx-6 flex flex-nowrap justify-start gap-2 overflow-x-auto border-y border-outline-variant/20 bg-surface/95 px-6 py-3 backdrop-blur-xl scrollbar-hide md:static md:mx-0 md:flex-wrap md:justify-center md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            {categories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`group relative h-9 shrink-0 overflow-hidden rounded-full px-4 text-[10px] font-black uppercase tracking-widest transition md:h-10 md:px-5 md:text-xs ${isActive
                    ? "text-on-secondary shadow-sm shadow-secondary/15"
                    : "border border-outline-variant/25 bg-surface-container-lowest text-on-surface-variant/70 hover:border-secondary/45 hover:text-secondary"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-secondary"
                      transition={{ type: "spring", bounce: 0.12, duration: 0.45 }}
                    />
                  )}

                  {isActive && isPending && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary border-2 border-on-secondary rounded-full z-20"
                    />
                  )}

                  <span className="relative z-10">{category === "Semua" ? dict.explore.all : dict.explore.categories[category as keyof typeof dict.explore.categories]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="mx-auto mb-28 max-w-7xl px-4 pt-7 md:px-12 lg:px-24"
        aria-busy={isPending}
      >
        <div className="mb-6 flex items-center justify-between px-1 md:mb-9">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary/10 text-secondary">
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </div>
            <p className="font-label text-xs font-black text-on-surface-variant uppercase tracking-widest">
              {filteredPosts.length} {dict.explore.found}
            </p>
          </div>

          {(searchFromUrl || activeCategory !== "Semua") && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-secondary transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              {dict.explore.resetFilter}
            </button>
          )}
        </div>

        <AnimatePresence mode="popLayout" initial={false}>
          {filteredPosts.length > 0 ? (
            <div className="space-y-12">
              <motion.div
                key={`${searchFromUrl}-${activeCategory}`}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.1
                    }
                  },
                  exit: {
                    opacity: 0,
                    transition: {
                      staggerChildren: 0.03,
                      staggerDirection: -1
                    }
                  }
                }}
                initial="hidden"
                animate="show"
                exit="exit"
                className={`relative grid grid-cols-1 gap-4 transition-opacity duration-200 md:grid-cols-2 md:gap-8 lg:gap-10 ${isPending ? 'opacity-80' : 'opacity-100'}`}
              >
                {isPending && (
                  <div className="absolute inset-x-0 -top-3 z-10 h-1 overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-secondary" />
                  </div>
                )}
                {visiblePosts.map((post) => (
                  <motion.div
                    key={post.id}
                    layout="position"
                    variants={{
                      hidden: { opacity: 0, y: 30, scale: 0.95 },
                      show: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { type: "spring", bounce: 0.3 }
                      },
                      exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
                    }}
                  >
                    <ArchiveCard post={post} lang={lang} labels={dict.explore} />
                  </motion.div>
                ))}
              </motion.div>

              {filteredPosts.length > displayLimit && (
                <div className="flex justify-center mt-16">
                  <button
                    onClick={() => setDisplayLimit(prev => prev + 8)}
                    className="group relative h-12 overflow-hidden rounded-full bg-surface-container-high px-10 text-sm font-black uppercase tracking-[0.16em] text-primary shadow-sm transition hover:bg-secondary hover:text-on-secondary hover:shadow-lg hover:shadow-secondary/15 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      {dict.explore.loadMore}
                      <span className="material-symbols-outlined transition-transform duration-500 group-hover:translate-y-1">expand_more</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg border border-dashed border-outline-variant/35 bg-surface-container-lowest py-20 text-center sm:py-28"
            >
              <div className="relative mb-8 inline-flex h-20 w-20 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant/25">
                <span className="material-symbols-outlined text-5xl relative z-10 transition-transform duration-500 group-hover:scale-110">search_off</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-headline font-black text-primary mb-4 tracking-tight">{dict.explore.emptyTitle}</h3>
              <p className="text-on-surface-variant/60 max-w-md mx-auto leading-relaxed mb-10">
                {dict.explore.emptyDescription}{searchFromUrl ? ` "${searchFromUrl}".` : ""}
              </p>
              <div className="mb-8 flex flex-wrap justify-center gap-2 px-4">
                {dict.explore.suggestedKeywords.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => handleSuggestedKeyword(keyword)}
                    className="rounded-full border border-outline-variant/35 bg-surface px-4 py-2 text-[11px] font-black uppercase tracking-wider text-secondary transition hover:border-secondary hover:bg-secondary/10 hover:text-primary"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-3 px-10 py-4 bg-surface-container-highest text-primary font-headline font-black text-sm uppercase tracking-widest rounded-full hover:bg-secondary hover:text-on-secondary transition-all duration-500 shadow-lg hover:shadow-secondary/20"
              >
                {dict.explore.resetAll}
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
