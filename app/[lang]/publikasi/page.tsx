"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import LanguageTabs from "@/components/common/LanguageTabs";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import {
  about,
  books,
  featuredBooks,
  journals,
  languages,
  type FeaturedBook,
  type LanguageCode,
} from "@/lib/brh-content";

type ActiveLanguage = "id" | "en";

const pageLabels: Record<
  ActiveLanguage,
  {
    eyebrow: string;
    title: string;
    intro: string;
    context: string;
    featuredBooks: string;
    featuredIntro: string;
    bibliography: string;
    journals: string;
    viewDocument: string;
    readBook: string;
    highlights: string;
    audience: string;
  }
> = {
  id: {
    eyebrow: "Karya Akademik",
    title: "Publikasi",
    intro:
      "Buku, artikel jurnal, dan kajian akademik yang menghubungkan spiritualitas Islam dengan persoalan sosial, pendidikan, kesejahteraan, dan pembangunan peradaban.",
    context: "Latar Intelektual",
    featuredBooks: "Buku Unggulan",
    featuredIntro:
      "Delapan karya yang merangkum pemikiran BRH tentang tasawuf, tarekat, pendidikan karakter, neosufisme, kesejahteraan sosial, ekonomi-politik, dan masa depan peradaban.",
    bibliography: "Bibliografi Lainnya",
    journals: "Artikel Jurnal",
    viewDocument: "LIHAT DOKUMEN",
    readBook: "BACA POST",
    highlights: "Poin Utama",
    audience: "Pembaca",
  },
  en: {
    eyebrow: "Academic Works",
    title: "Publications",
    intro:
      "Books, journal articles, and academic studies connecting Islamic spirituality with social issues, education, welfare, and civilizational development.",
    context: "Intellectual Context",
    featuredBooks: "Featured Books",
    featuredIntro:
      "Eight works presenting BRH's thought on Sufism, Sufi orders, character education, Neo-Sufism, social welfare, political economy, and the future of civilization.",
    bibliography: "Additional Bibliography",
    journals: "Journal Articles",
    viewDocument: "VIEW DOCUMENT",
    readBook: "READ POST",
    highlights: "Key Points",
    audience: "Readers",
  },
};

const publicationSummary: Record<ActiveLanguage, string> = {
  id: "Budi Rahman Hakim adalah penulis produktif yang karya-karyanya bergerak di bidang tasawuf, tarekat, neo-sufisme, kesejahteraan sosial Islam, pendidikan karakter, dakwah sosial, dan transformasi masyarakat Muslim kontemporer.",
  en: "Budi Rahman Hakim is a prolific author whose works focus on Sufism, Sufi orders, Neo-Sufism, Islamic social welfare, character education, social da'wah, and the transformation of contemporary Muslim society.",
};

function getActiveLanguage(language: LanguageCode): ActiveLanguage {
  return language === "en" ? "en" : "id";
}

function getBookHref(book: FeaturedBook, language: ActiveLanguage) {
  const slug = language === "en" ? book.slugEn : book.slug;
  return `/${language}/post/${slug}`;
}

function BookCard({
  title,
  year,
  dir,
  index,
}: {
  title: string;
  year: string;
  dir: "ltr" | "rtl";
  index: number;
}) {
  return (
    <motion.article
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      viewport={{ once: true }}
      whileHover={{ y: -3 }}
      className="group rounded-lg border border-outline-variant/50 bg-white/80 p-5 shadow-sm transition-all duration-300 hover:border-secondary/30 hover:shadow-xl hover:shadow-primary/5"
      dir={dir}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary transition-colors group-hover:bg-secondary group-hover:text-white">
          <span className="material-symbols-outlined text-xl">menu_book</span>
        </div>
        <div>
          <p className="mb-2 font-label text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface/40">
            {year}
          </p>
          <h3 className="text-balance font-headline text-base font-black leading-tight text-primary">
            {title}
          </h3>
        </div>
      </div>
    </motion.article>
  );
}

function FeaturedBookCard({
  book,
  language,
  labels,
  index,
}: {
  book: FeaturedBook;
  language: ActiveLanguage;
  labels: (typeof pageLabels)[ActiveLanguage];
  index: number;
}) {
  const title = book.title[language];
  const subtitle = book.subtitle?.[language];

  return (
    <motion.article
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      viewport={{ once: true }}
      className="group overflow-hidden rounded-lg border border-outline-variant/35 bg-surface shadow-sm transition duration-300 hover:border-secondary/35 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className="grid gap-0 md:grid-cols-[240px_minmax(0,1fr)]">
        <OptimisticLink
          href={getBookHref(book, language)}
          className="relative block aspect-square overflow-hidden bg-surface-container"
        >
          <Image
            src={book.cover}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 260px"
            unoptimized={
              book.cover.startsWith("/book-cover/") || book.cover.startsWith("/api/book-cover/")
            }
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        </OptimisticLink>

        <div className="flex flex-col p-5 sm:p-6 lg:p-7">
          <div className="mb-4 flex flex-wrap items-center gap-2 font-label text-[10px] font-black uppercase tracking-[0.18em] text-secondary">
            <span>{book.year}</span>
            <span className="h-px w-6 bg-outline-variant" />
            <span>{book.category[language]}</span>
          </div>

          <h3 className="text-pretty font-headline text-2xl font-black leading-tight tracking-tight text-primary md:text-3xl">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-2 text-sm font-semibold leading-relaxed text-tertiary md:text-base">
              {subtitle}
            </p>
          )}
          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-on-surface/75 md:text-base">
            {book.summary[language]}
          </p>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-2 font-label text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/45">
                {labels.highlights}
              </p>
              <ul className="space-y-2 text-sm leading-relaxed text-on-surface/70">
                {book.highlights[language].slice(0, 3).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-label text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/45">
                {labels.audience}
              </p>
              <ul className="space-y-2 text-sm leading-relaxed text-on-surface/70">
                {book.audience[language].slice(0, 2).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tertiary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <OptimisticLink
            href={getBookHref(book, language)}
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 font-label text-[11px] font-black uppercase tracking-[0.18em] text-on-primary transition hover:bg-tertiary active:scale-[0.98]"
          >
            {labels.readBook}
            <span className="material-symbols-outlined text-[16px]">east</span>
          </OptimisticLink>
        </div>
      </div>
    </motion.article>
  );
}

function PublicationContent({ language }: { language: LanguageCode }) {
  const activeLanguage = getActiveLanguage(language);
  const isArabic = language === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const labels = pageLabels[activeLanguage];

  return (
    <motion.div
      key={language}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-20"
      dir={dir}
    >
      <section className={isArabic ? "text-right" : ""}>
        <div className="mb-8 flex items-baseline gap-4">
          <span className="font-label text-4xl font-black text-secondary/20">01</span>
          <h2 className="font-headline text-3xl font-black tracking-tight text-primary md:text-4xl">
            {labels.context}
          </h2>
        </div>
        <div
          className={`prose prose-lg max-w-4xl font-body leading-relaxed text-on-surface/80 ${
            isArabic ? "mr-auto text-right prose-p:leading-loose" : ""
          }`}
        >
          <p>{about[activeLanguage][0]}</p>
          <p>{publicationSummary[activeLanguage]}</p>
        </div>
      </section>

      <section className={isArabic ? "text-right" : ""}>
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex items-baseline gap-4">
            <span className="font-label text-4xl font-black text-secondary/20">02</span>
            <h2 className="font-headline text-3xl font-black tracking-tight text-primary md:text-4xl">
              {labels.featuredBooks}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-on-surface/65 md:text-right md:text-base">
            {labels.featuredIntro}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {featuredBooks.map((book, index) => (
            <FeaturedBookCard
              key={book.slug}
              book={book}
              language={activeLanguage}
              labels={labels}
              index={index}
            />
          ))}
        </div>
      </section>

      <section className={isArabic ? "text-right" : ""}>
        <div className="mb-8 flex items-baseline gap-4">
          <span className="font-label text-4xl font-black text-secondary/20">03</span>
          <h2 className="font-headline text-3xl font-black tracking-tight text-primary md:text-4xl">
            {labels.bibliography}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {books.map((book, index) => (
            <BookCard
              key={`${book.year}-${book.title.id}`}
              title={book.title[activeLanguage]}
              year={book.year}
              dir={dir}
              index={index}
            />
          ))}
        </div>
      </section>

      <section className={isArabic ? "text-right" : ""}>
        <div className="mb-8 flex items-baseline gap-4">
          <span className="font-label text-4xl font-black text-secondary/20">04</span>
          <h2 className="font-headline text-3xl font-black tracking-tight text-primary md:text-4xl">
            {labels.journals}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5">
          {journals.map((journal, index) => (
            <motion.article
              key={journal.url}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025 }}
              viewport={{ once: true }}
              className="group border-b border-outline-variant/50 pb-6 transition-colors last:border-0 hover:border-secondary/30"
            >
              <p className="mb-2 font-label text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface/40">
                {journal.year}
              </p>
              <a href={journal.url} target="_blank" rel="noopener noreferrer" className="block">
                <h3 className="text-balance font-headline text-lg font-black leading-snug text-primary transition-colors group-hover:text-secondary">
                  {journal.title}
                </h3>
                <p className="mt-2 font-body text-sm italic text-on-surface/60">
                  {journal.reference}
                </p>
                <div className="mt-4 flex items-center gap-2 font-label text-[10px] font-bold text-secondary">
                  {labels.viewDocument}
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </div>
              </a>
            </motion.article>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

export default function PublikasiPage() {
  const params = useParams<{ lang?: string }>();
  const defaultLanguage: LanguageCode = params.lang === "en" ? "en" : "id";

  return (
    <div className="min-h-screen bg-background pb-24">
      <section className="relative overflow-hidden px-6 py-20 md:px-12 lg:px-24">
        <div className="absolute inset-x-0 top-0 h-64 bg-linear-to-b from-secondary/10 to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <LanguageTabs languages={languages} defaultLanguage={defaultLanguage}>
            {(language) => {
              const isArabic = language === "ar";
              const activeLanguage = getActiveLanguage(language);
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

                  <PublicationContent language={language} />
                </div>
              );
            }}
          </LanguageTabs>
        </div>
      </section>
    </div>
  );
}
