"use client";

import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import LanguageTabs from "@/components/common/LanguageTabs";
import {
  about,
  books,
  journals,
  languages,
  type LanguageCode,
} from "@/lib/brh-content";

const pageLabels: Record<
  LanguageCode,
  {
    eyebrow: string;
    title: string;
    intro: string;
    context: string;
    books: string;
    journals: string;
    viewDocument: string;
  }
> = {
  id: {
    eyebrow: "Karya Akademik",
    title: "Publikasi",
    intro:
      "Buku, artikel jurnal, dan kajian akademik yang menghubungkan spiritualitas Islam dengan persoalan sosial, pendidikan, kesejahteraan, dan pembangunan peradaban.",
    context: "Latar Intelektual",
    books: "Buku",
    journals: "Artikel Jurnal",
    viewDocument: "LIHAT DOKUMEN",
  },
  en: {
    eyebrow: "Academic Works",
    title: "Publications",
    intro:
      "Books, journal articles, and academic studies connecting Islamic spirituality with social issues, education, welfare, and civilizational development.",
    context: "Intellectual Context",
    books: "Books",
    journals: "Journal Articles",
    viewDocument: "VIEW DOCUMENT",
  },
  ar: {
    eyebrow: "Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ©",
    title: "Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª",
    intro:
      "ÙƒØªØ¨ ÙˆÙ…Ù‚Ø§Ù„Ø§Øª Ø¹Ù„Ù…ÙŠØ© ÙˆØ¯Ø±Ø§Ø³Ø§Øª Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© ØªØ±Ø¨Ø· Ø§Ù„Ø±ÙˆØ­Ø§Ù†ÙŠØ© Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠØ© Ø¨Ø§Ù„Ù‚Ø¶Ø§ÙŠØ§ Ø§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠØ© ÙˆØ§Ù„ØªØ¹Ù„ÙŠÙ… ÙˆØ§Ù„Ø±Ø¹Ø§ÙŠØ© ÙˆØ¨Ù†Ø§Ø¡ Ø§Ù„Ø­Ø¶Ø§Ø±Ø©.",
    context: "Ø§Ù„Ø³ÙŠØ§Ù‚ Ø§Ù„ÙÙƒØ±ÙŠ",
    books: "Ø§Ù„ÙƒØªØ¨",
    journals: "Ø§Ù„Ù…Ù‚Ø§Ù„Ø§Øª Ø§Ù„Ø¹Ù„Ù…ÙŠØ©",
    viewDocument: "Ø¹Ø±Ø¶ Ø§Ù„ÙˆØ«ÙŠÙ‚Ø©",
  },
};

const publicationSummary: Record<LanguageCode, string> = {
  id: "Budi Rahman Hakim adalah penulis produktif yang karya-karyanya bergerak di bidang tasawuf, tarekat, neo-sufisme, kesejahteraan sosial Islam, pendidikan karakter, dakwah sosial, dan transformasi masyarakat Muslim kontemporer.",
  en: "Budi Rahman Hakim is a prolific author whose works focus on Sufism, Sufi orders, Neo-Sufism, Islamic social welfare, character education, social da'wah, and the transformation of contemporary Muslim society.",
  ar: "Ø¨ÙˆØ¯ÙŠ Ø±Ø­Ù…Ù† Ø­ÙƒÙŠÙ… ÙƒØ§ØªØ¨ ØºØ²ÙŠØ± Ø§Ù„Ø¥Ù†ØªØ§Ø¬ ØªØªÙ†Ø§ÙˆÙ„ Ø£Ø¹Ù…Ø§Ù„Ù‡ Ø§Ù„ØªØµÙˆÙ ÙˆØ§Ù„Ø·Ø±Ù‚ Ø§Ù„ØµÙˆÙÙŠØ© ÙˆØ§Ù„ØªØµÙˆÙ Ø§Ù„Ø¬Ø¯ÙŠØ¯ ÙˆØ§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠØ© Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠØ©.",
};

const BookCard = ({
  title,
  year,
  dir,
  index,
}: {
  title: string;
  year: string;
  dir: "ltr" | "rtl";
  index: number;
}) => (
  <motion.article
    initial={false}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.03 }}
    viewport={{ once: true }}
    whileHover={{ y: -3 }}
    className="group rounded-2xl border border-outline-variant/50 bg-white/80 p-5 shadow-sm transition-all duration-300 hover:border-secondary/30 hover:shadow-xl hover:shadow-primary/5"
    dir={dir}
  >
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary transition-colors group-hover:bg-secondary group-hover:text-white">
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

const PublicationContent = ({ language }: { language: LanguageCode }) => {
  const isArabic = language === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const labels = pageLabels[language];

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
          <p>{about[language][0]}</p>
          <p>{publicationSummary[language]}</p>
        </div>
      </section>

      <section className={isArabic ? "text-right" : ""}>
        <div className="mb-8 flex items-baseline gap-4">
          <span className="font-label text-4xl font-black text-secondary/20">02</span>
          <h2 className="font-headline text-3xl font-black tracking-tight text-primary md:text-4xl">
            {labels.books}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {books.map((book, index) => (
            <BookCard
              key={`${book.year}-${book.title.id}`}
              title={book.title[language]}
              year={book.year}
              dir={dir}
              index={index}
            />
          ))}
        </div>
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
};

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
              const labels = pageLabels[language];

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
