"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function HeroSearch() {
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (query.trim()) {
      router.push(`/explore?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/explore");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="w-full max-w-2xl mt-12 relative group"
    >
      <form onSubmit={handleSearch}>
        {/* Animated Background Aura */}
        <div className="absolute -inset-1 bg-linear-to-r from-secondary/30 via-primary/20 to-secondary/30 rounded-full blur-md opacity-20 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-500"></div>

        <div className="relative bg-surface-container-low/90 backdrop-blur-2xl rounded-full px-2 py-2 flex items-center gap-3 border border-outline-variant/20 shadow-2xl shadow-primary/5 transition-all duration-500 group-focus-within:border-secondary/40">
          <div className="flex-1 flex items-center gap-4 pl-6">
            <span className={`material-symbols-outlined transition-colors duration-500 ${isSubmitting ? 'text-secondary animate-spin' : 'text-on-surface-variant/40 group-focus-within:text-secondary'}`}>
              {isSubmitting ? 'sync' : 'search'}
            </span>
            <input
              className="bg-transparent border-none outline-none focus:ring-0 w-full font-body text-lg text-primary placeholder:text-on-surface-variant/40"
              placeholder="Cari topik pemikiran, riset, atau judul karya..."
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-on-primary hover:bg-secondary p-4 rounded-full font-headline font-black transition-all duration-500 shadow-lg shadow-primary/20 hover:shadow-secondary/30 active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">search</span>
          </button>
        </div>
      </form>

      {/* Suggestion hints */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant/40">
        <span>Trending:</span>
        <button onClick={() => setQuery("Tasawuf")} className="hover:text-secondary transition-colors">Tasawuf</button>
        <button onClick={() => setQuery("Pendidikan")} className="hover:text-secondary transition-colors">Pendidikan</button>
      </div>
    </motion.div>
  );
}
