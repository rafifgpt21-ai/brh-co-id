"use client";

import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import LanguageTabs from "@/components/common/LanguageTabs";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import {
  languages,
  researchAgenda,
  researchAreas,
  type LanguageCode,
} from "@/lib/brh-content";

type ActiveLanguage = Extract<LanguageCode, "id" | "en">;

const pageLabels: Record<
  LanguageCode,
  {
    eyebrow: string;
    title: string;
    intro: string;
    agenda: string;
    areas: string;
  }
> = {
  id: {
    eyebrow: "Agenda Intelektual",
    title: "Riset",
    intro: "Kajian tasawuf, kesejahteraan sosial, pendidikan, ekonomi, dan peradaban untuk menjawab tantangan kontemporer.",
    agenda: "Kerangka Pemikiran",
    areas: "Ruang Kajian",
  },
  en: {
    eyebrow: "Intellectual Agenda",
    title: "Research",
    intro: "Sufism, social welfare, education, economics, and civilizational studies brought together for contemporary questions.",
    agenda: "Research Agenda",
    areas: "Research Areas",
  },
  ar: {
    eyebrow: "الأجندة الفكرية",
    title: "البحوث",
    intro: "دراسات في التصوف والرعاية الاجتماعية والتعليم والاقتصاد وبناء الحضارة لمواجهة أسئلة العصر.",
    agenda: "الإطار الفكري",
    areas: "مجالات البحث",
  },
};

const ResearchContent = ({ language }: { language: LanguageCode }) => {
  const isArabic = language === "ar";
  const labels = pageLabels[language];

  return (
    <motion.div
      key={language}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-20"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <section className={isArabic ? "text-right" : ""}>
        <div className="mb-8 flex items-baseline gap-4">
          <span className="font-label text-4xl font-black text-secondary/20">01</span>
          <h2 className="font-headline text-3xl font-black tracking-tight text-primary md:text-4xl">
            {labels.agenda}
          </h2>
        </div>
        <div
          className={`prose prose-lg max-w-4xl font-body leading-relaxed text-on-surface/80 ${
            isArabic ? "mr-auto text-right prose-p:leading-loose" : ""
          }`}
        >
          {researchAgenda[language].map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className={isArabic ? "text-right" : ""}>
        <div className="mb-8 flex items-baseline gap-4">
          <span className="font-label text-4xl font-black text-secondary/20">02</span>
          <h2 className="font-headline text-3xl font-black tracking-tight text-primary md:text-4xl">
            {labels.areas}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {researchAreas.map((area, index) => (
            <motion.article
              key={area.title.id}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-outline-variant/50 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <h3 className="font-headline text-xl font-black leading-tight text-primary">
                {area.title[language]}
              </h3>
              {area.subtitle && (
                <p className="mt-2 font-headline text-sm font-bold leading-relaxed text-secondary">
                  {area.subtitle[language]}
                </p>
              )}
              <p className="mt-5 font-body text-sm leading-relaxed text-on-surface/70">
                {area.description[language]}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      <section>
        <div className="rounded-lg border border-outline-variant/45 bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_auto] lg:items-center">
            <div>
              <span className="font-label text-[10px] font-black uppercase tracking-[0.24em] text-secondary">
                {language === "id" ? "Output Riset" : "Research Output"}
              </span>
              <h2 className="mt-3 font-headline text-2xl font-black tracking-tight text-primary md:text-3xl">
                {language === "id"
                  ? "Dari agenda pemikiran menuju publikasi terbaca"
                  : "From research agenda to readable publications"}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-on-surface/72 md:text-base">
                {language === "id"
                  ? "Ruang riset ini menjadi pintu masuk untuk memahami tema besar BRH, sementara publikasi dan katalog menyimpan keluaran akademik, buku, artikel, dan arsip terkait."
                  : "This research space introduces BRH's core themes, while publications and the catalog preserve related academic output, books, articles, and archives."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <OptimisticLink
                href={`/${language}/publikasi`}
                className="tap-target inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-on-primary transition hover:bg-tertiary"
              >
                {language === "id" ? "Lihat Publikasi" : "View Publications"}
                <span className="material-symbols-outlined text-[18px]">east</span>
              </OptimisticLink>
              <OptimisticLink
                href={`/${language}/explore?category=Jurnal`}
                className="tap-target inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant/50 bg-surface px-5 text-sm font-black text-primary transition hover:border-secondary hover:bg-secondary/10"
              >
                {language === "id" ? "Jelajahi Jurnal" : "Explore Journals"}
                <span className="material-symbols-outlined text-[18px]">travel_explore</span>
              </OptimisticLink>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default function RisetPage() {
  const params = useParams<{ lang?: string }>();
  const defaultLanguage: ActiveLanguage = params.lang === "en" ? "en" : "id";

  return (
    <div className="min-h-screen bg-background pb-24">
      <section className="relative overflow-hidden px-6 py-20 md:px-12 lg:px-24">
        <div className="absolute inset-x-0 top-0 h-64 bg-linear-to-b from-secondary/10 to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <LanguageTabs languages={languages} defaultLanguage={defaultLanguage}>
            {(language) => {
              const activeLanguage: ActiveLanguage = language === "en" ? "en" : "id";
              const isArabic = false;
              const labels = pageLabels[activeLanguage];

              return (
                <div className="space-y-16">
                  <motion.header
                    key={`hero-${language}`}
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-4xl ${isArabic ? "mr-auto text-right" : ""}`}
                    dir={isArabic ? "rtl" : "ltr"}
                  >
                    <span className="mb-5 block font-label text-xs font-bold uppercase tracking-[0.3em] text-secondary">
                      {labels.eyebrow}
                    </span>
                    <h1 className="font-headline text-5xl font-black leading-none tracking-tight text-primary md:text-7xl">
                      {labels.title}
                    </h1>
                    <p className="mt-8 max-w-3xl font-body text-lg leading-relaxed text-on-surface/70 md:text-xl">
                      {labels.intro}
                    </p>
                  </motion.header>

                  <ResearchContent language={activeLanguage} />
                </div>
              );
            }}
          </LanguageTabs>
        </div>
      </section>
    </div>
  );
}
