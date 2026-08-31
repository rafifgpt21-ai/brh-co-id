"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import LanguageTabs from "@/components/common/LanguageTabs";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import {
  about,
  GOOGLE_SCHOLAR_URL,
  journals,
  languages,
  type LanguageCode,
} from "@/lib/brh-content";

type ActiveLanguage = "id" | "en";

export type PublicationBookPost = {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  slugEn: string | null;
  thumbnail: string | null;
  publishedAt: string;
  summary: string;
  summaryEn: string;
};

const pageLabels: Record<
  ActiveLanguage,
  {
    eyebrow: string;
    title: string;
    intro: string;
    context: string;
    books: string;
    booksIntro: string;
    bookCount: (count: number) => string;
    emptyBooks: string;
    journals: string;
    viewDocument: string;
    googleScholar: string;
    readBook: string;
    fallbackSummary: string;
  }
> = {
  id: {
    eyebrow: "Karya Akademik",
    title: "Publikasi",
    intro:
      "Buku, artikel jurnal, dan kajian akademik yang menghubungkan spiritualitas Islam dengan persoalan sosial, pendidikan, kesejahteraan, dan pembangunan peradaban.",
    context: "Latar Intelektual",
    books: "Daftar Buku",
    booksIntro:
      "Koleksi buku yang telah dipublikasikan melalui BRH Insight, diurutkan dari terbitan terbaru.",
    bookCount: (count) => `${count} buku`,
    emptyBooks: "Belum ada post buku yang dipublikasikan.",
    journals: "Artikel Jurnal",
    viewDocument: "LIHAT DOKUMEN",
    googleScholar: "LIHAT GOOGLE SCHOLAR",
    readBook: "BACA POST",
    fallbackSummary: "Buka post untuk membaca informasi dan isi buku selengkapnya.",
  },
  en: {
    eyebrow: "Academic Works",
    title: "Publications",
    intro:
      "Books, journal articles, and academic studies connecting Islamic spirituality with social issues, education, welfare, and civilizational development.",
    context: "Intellectual Context",
    books: "Book List",
    booksIntro:
      "Books published through BRH Insight, ordered from the most recent publication.",
    bookCount: (count) => `${count} ${count === 1 ? "book" : "books"}`,
    emptyBooks: "No book posts have been published yet.",
    journals: "Journal Articles",
    viewDocument: "VIEW DOCUMENT",
    googleScholar: "VIEW GOOGLE SCHOLAR",
    readBook: "READ POST",
    fallbackSummary: "Open the post to read the complete book information and content.",
  },
};

const publicationSummary: Record<ActiveLanguage, string> = {
  id: "Budi Rahman Hakim adalah penulis produktif yang karya-karyanya bergerak di bidang tasawuf, tarekat, neo-sufisme, kesejahteraan sosial Islam, pendidikan karakter, dakwah sosial, dan transformasi masyarakat Muslim kontemporer.",
  en: "Budi Rahman Hakim is a prolific author whose works focus on Sufism, Sufi orders, Neo-Sufism, Islamic social welfare, character education, social da'wah, and the transformation of contemporary Muslim society.",
};

function getActiveLanguage(language: LanguageCode): ActiveLanguage {
  return language === "en" ? "en" : "id";
}

function getLocalizedBook(book: PublicationBookPost, language: ActiveLanguage) {
  return {
    title: language === "en" ? book.titleEn || book.title : book.title,
    slug: language === "en" ? book.slugEn || book.slug : book.slug,
    summary: language === "en" ? book.summaryEn || book.summary : book.summary,
  };
}

function BookCard({
  book,
  language,
  labels,
  index,
}: {
  book: PublicationBookPost;
  language: ActiveLanguage;
  labels: (typeof pageLabels)[ActiveLanguage];
  index: number;
}) {
  const localizedBook = getLocalizedBook(book, language);
  const href = `/${language}/post/${localizedBook.slug}`;
  const year = new Intl.DateTimeFormat(language === "en" ? "en" : "id", {
    year: "numeric",
  }).format(new Date(book.publishedAt));

  return (
    <motion.article
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 6) * 0.035 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="group relative isolate overflow-hidden rounded-2xl border border-outline-variant/30 bg-linear-to-br from-surface via-surface to-secondary/[0.045] shadow-[0_10px_32px_rgba(31,41,55,0.06)] transition duration-300 hover:border-secondary/30 hover:shadow-[0_18px_44px_rgba(31,41,55,0.11)]"
    >
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-secondary/35 to-transparent" />
      <OptimisticLink
        href={href}
        className="grid h-full grid-cols-[104px_minmax(0,1fr)] items-center gap-4 p-3 sm:grid-cols-[156px_minmax(0,1fr)] sm:gap-6 sm:p-5"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/80 bg-surface-container shadow-[0_10px_24px_rgba(31,41,55,0.12)] ring-1 ring-outline-variant/20 sm:rounded-2xl">
          {book.thumbnail ? (
            <>
              <Image
                src={book.thumbnail}
                alt=""
                fill
                aria-hidden="true"
                sizes="(max-width: 640px) 104px, 156px"
                className="scale-125 object-cover opacity-25 blur-xl transition duration-700 group-hover:scale-[1.35]"
              />
              <div className="absolute inset-2 overflow-hidden rounded-lg bg-white/85 shadow-sm backdrop-blur-sm sm:inset-2.5 sm:rounded-xl">
                <Image
                  src={book.thumbnail}
                  alt={localizedBook.title}
                  fill
                  sizes="(max-width: 640px) 104px, 156px"
                  className="object-contain transition duration-700 group-hover:scale-[1.035]"
                />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-linear-to-br from-secondary/15 via-surface-container to-primary/10 text-secondary">
              <span className="material-symbols-outlined text-4xl">menu_book</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col py-1 sm:py-0">
          <div className="mb-3 flex flex-wrap items-center gap-2 font-label text-[9px] font-black uppercase tracking-[0.18em] sm:text-[10px]">
            <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-secondary">
              {year}
            </span>
            <span className="rounded-full border border-outline-variant/40 bg-surface/70 px-2.5 py-1 text-on-surface/50">
              {language === "en" ? "Book" : "Buku"}
            </span>
          </div>
          <h3 className="line-clamp-3 text-pretty font-headline text-base font-black leading-tight text-primary transition-colors group-hover:text-secondary sm:text-xl">
            {localizedBook.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-on-surface/60 sm:mt-3 sm:line-clamp-3 sm:text-sm">
            {localizedBook.summary || labels.fallbackSummary}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-outline-variant/25 pt-3 sm:mt-5 sm:pt-4">
            <span className="font-label text-[9px] font-black uppercase tracking-[0.17em] text-secondary sm:text-[10px]">
              {labels.readBook}
            </span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-secondary/20 bg-secondary/[0.07] text-secondary transition duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary sm:h-9 sm:w-9">
              <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
            </span>
          </div>
        </div>
      </OptimisticLink>
    </motion.article>
  );
}

function PublicationContent({
  language,
  books,
}: {
  language: LanguageCode;
  books: PublicationBookPost[];
}) {
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
              {labels.books}
            </h2>
          </div>
          <div className="max-w-2xl md:text-right">
            <p className="text-sm leading-relaxed text-on-surface/65 md:text-base">
              {labels.booksIntro}
            </p>
            <p className="mt-2 font-label text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
              {labels.bookCount(books.length)}
            </p>
          </div>
        </div>

        {books.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {books.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                language={activeLanguage}
                labels={labels}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container/40 px-6 py-12 text-center text-on-surface/60">
            <span className="material-symbols-outlined mb-3 block text-4xl text-secondary/50">
              menu_book
            </span>
            <p>{labels.emptyBooks}</p>
          </div>
        )}
      </section>

      <section className={isArabic ? "text-right" : ""}>
        <div className="mb-8 flex items-baseline gap-4">
          <span className="font-label text-4xl font-black text-secondary/20">03</span>
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
              transition={{ delay: (index % 8) * 0.025 }}
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

export default function PublicationClient({
  books,
  initialLanguage,
}: {
  books: PublicationBookPost[];
  initialLanguage: ActiveLanguage;
}) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <section className="relative overflow-hidden px-6 py-20 md:px-12 lg:px-24">
        <div className="absolute inset-x-0 top-0 h-64 bg-linear-to-b from-secondary/10 to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <LanguageTabs languages={languages} defaultLanguage={initialLanguage}>
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
                    <a
                      href={GOOGLE_SCHOLAR_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-label text-[11px] font-black uppercase tracking-[0.18em] text-on-primary transition hover:bg-tertiary active:scale-[0.98]"
                    >
                      {labels.googleScholar}
                      <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                    </a>
                  </motion.header>

                  <PublicationContent language={language} books={books} />
                </div>
              );
            }}
          </LanguageTabs>
        </div>
      </section>
    </div>
  );
}
