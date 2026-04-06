"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { Post } from "@/app/generated/prisma/client";
import ArchiveCard from "./ArchiveCard";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface KatalogClientProps {
  initialPosts: Post[];
}

const categories = ["Semua", "Buku", "Jurnal", "Artikel", "Opini"];

export default function KatalogClient({ initialPosts }: KatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const searchFromUrl = searchParams.get("search") || "";
  const categoryFromUrl = searchParams.get("category") || "Semua";

  // Real-time input value
  const [inputValue, setInputValue] = useState(searchFromUrl);
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl);
  
  // Local pagination to avoid rendering too many items
  const [displayLimit, setDisplayLimit] = useState(12);

  useEffect(() => {
    setInputValue(searchFromUrl);
    setActiveCategory(categoryFromUrl);
  }, [searchFromUrl, categoryFromUrl]);

  const handleSearchCommit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (inputValue.trim()) {
        params.set("search", inputValue.trim());
      } else {
        params.delete("search");
      }
      router.push(`/explore?${params.toString()}`, { scroll: false });
    });
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
      router.push(`/explore?${params.toString()}`, { scroll: false });
    });
  };

  const handleReset = () => {
    setInputValue("");
    setActiveCategory("Semua");
    setDisplayLimit(12);
    router.push(`/explore`, { scroll: false });
  };

  const filteredPosts = initialPosts; // Already filtered by server
  const visiblePosts = useMemo(() => filteredPosts.slice(0, displayLimit), [filteredPosts, displayLimit]);

  return (
    <div className="w-full">
      {/* Search & Filter Section */}
      <section className="relative py-16 md:py-24 mb-12">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-secondary-fixed blur-[140px] rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary-fixed blur-[120px] rounded-full opacity-60"></div>
        </div>

        <div className="max-w-4xl mx-auto px-6">
          {/* Header text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="font-label text-xs font-black tracking-[0.3em] text-secondary uppercase block mb-4">Eksplorasi Intelektual</span>
            <h1 className="font-headline font-black text-5xl md:text-7xl text-primary mb-6 tracking-tight">Katalog Karya</h1>
            <p className="text-on-surface-variant/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Telusuri rekaman pemikiran, hasil riset mendalam, dan opini kritis untuk memperluas cakrawala intelektual Anda.
            </p>
          </motion.div>

          {/* Search Bar UI */}
          <div className="relative max-w-3xl mx-auto mb-12 group">
            <div className="absolute -inset-1 bg-linear-to-r from-secondary/20 via-primary/10 to-secondary/20 rounded-[2.5rem] blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-500"></div>

            <form
              onSubmit={handleSearchCommit}
              className="relative bg-surface-container-low/90 backdrop-blur-2xl rounded-[2.5rem] p-2 flex items-center gap-2 border border-outline-variant/20 shadow-xl shadow-primary/5 group-focus-within:border-secondary/30 transition-all duration-500"
            >
              <div className="flex-1 flex items-center gap-4 pl-6">
                <span className={`material-symbols-outlined transition-colors duration-500 ${isPending ? 'text-secondary animate-spin scale-110' : 'text-on-surface-variant/40 group-focus-within:text-secondary'}`}>
                  {isPending ? 'sync' : 'search'}
                </span>
                <input
                  className="bg-transparent border-none outline-none focus:ring-0 w-full font-body text-base md:text-lg text-primary placeholder:text-on-surface-variant/40"
                  placeholder="Cari judul, topik, atau kata kunci..."
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => { setInputValue(""); }}
                    className="p-1.5 hover:bg-surface-container-high rounded-full text-on-surface-variant/40 hover:text-secondary transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="bg-primary text-on-primary hover:bg-secondary p-4 rounded-full font-headline font-black transition-all duration-500 shadow-lg shadow-primary/20 hover:shadow-secondary/30 active:scale-95 flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[24px]">search</span>
              </button>
            </form>
          </div>

          {/* Category Quick Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`group relative px-6 py-2.5 rounded-full text-[10px] md:text-xs font-label font-black tracking-widest uppercase transition-all duration-500 overflow-hidden ${activeCategory === category
                  ? "bg-secondary text-on-secondary shadow-lg shadow-secondary/20 scale-105"
                  : "bg-surface-container-lowest text-on-surface-variant/60 border border-outline-variant/15 hover:border-secondary/40 hover:text-secondary"
                  }`}
              >
                <span className="relative z-10">{category}</span>
                {activeCategory !== category && (
                  <span className="absolute inset-0 bg-secondary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
                )}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 mb-32">
        <div className="flex items-center justify-between mb-12 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </div>
            <p className="font-label text-xs font-black text-on-surface-variant uppercase tracking-widest">
              {filteredPosts.length} Karya Ditemukan
            </p>
          </div>

          {(searchFromUrl || activeCategory !== "Semua") && (
            <button
              onClick={handleReset}
              className="text-xs font-black text-secondary hover:text-primary transition-colors flex items-center gap-2 uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Reset Filter
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {filteredPosts.length > 0 ? (
            <div className="space-y-12">
              <motion.div
                key={`${searchFromUrl}-${activeCategory}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
              >
                {visiblePosts.map((post) => (
                  <ArchiveCard key={post.id} post={post} />
                ))}
              </motion.div>

              {filteredPosts.length > displayLimit && (
                <div className="flex justify-center mt-16">
                  <button
                    onClick={() => setDisplayLimit(prev => prev + 8)}
                    className="group relative px-12 py-5 bg-surface-container-high text-primary font-headline font-black text-sm uppercase tracking-[0.2em] rounded-2xl overflow-hidden transition-all duration-500 hover:bg-secondary hover:text-on-secondary shadow-lg hover:shadow-secondary/20 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Muat Lebih Banyak
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
              className="text-center py-32 bg-surface-container-low/30 backdrop-blur-xl border-2 border-dashed border-outline-variant/20 rounded-[3rem]"
            >
              <div className="inline-flex w-24 h-24 items-center justify-center rounded-4xl bg-surface-container mb-8 text-on-surface-variant/20 relative group">
                <div className="absolute inset-0 bg-secondary/10 rounded-4xl scale-150 blur-3xl group-hover:bg-secondary/20 transition-all duration-1000"></div>
                <span className="material-symbols-outlined text-5xl relative z-10 transition-transform duration-500 group-hover:scale-110">search_off</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-headline font-black text-primary mb-4 tracking-tight">Eksplorasi Tak Ditemukan</h3>
              <p className="text-on-surface-variant/60 max-w-md mx-auto leading-relaxed mb-10">
                Kami tidak dapat menemukan karya yang sesuai dengan "{searchFromUrl}".
                Coba gunakan kata kunci intelektual lainnya atau atur ulang kategori.
              </p>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-3 px-10 py-4 bg-surface-container-highest text-primary font-headline font-black text-sm uppercase tracking-widest rounded-full hover:bg-secondary hover:text-on-secondary transition-all duration-500 shadow-lg hover:shadow-secondary/20"
              >
                Reset Semua Filter
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
