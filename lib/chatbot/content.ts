import {
  about,
  books,
  journals,
  researchAgenda,
  researchAreas,
} from "@/lib/brh-content";
import type { Locale } from "@/lib/i18n/config";

export type KnowledgeSource = {
  sourceType: "post" | "static_page" | "quick_post";
  sourceId: string;
  locale: Locale;
  title: string;
  url: string;
  category?: string;
  thumbnail?: string | null;
  content: string;
};

export type KnowledgeChunkInput = KnowledgeSource & {
  chunkIndex: number;
};

const CHUNK_SIZE = 1400;
const CHUNK_OVERLAP = 180;

export function htmlToText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function chunkSource(source: KnowledgeSource): KnowledgeChunkInput[] {
  const content = htmlToText(source.content);
  if (content.length <= CHUNK_SIZE) {
    return [{ ...source, content, chunkIndex: 0 }];
  }

  const chunks: KnowledgeChunkInput[] = [];
  let cursor = 0;

  while (cursor < content.length) {
    const end = Math.min(cursor + CHUNK_SIZE, content.length);
    let nextEnd = end;

    if (end < content.length) {
      const sentenceBreak = content.lastIndexOf(".", end);
      const paragraphBreak = content.lastIndexOf("\n", end);
      const breakPoint = Math.max(sentenceBreak, paragraphBreak);
      if (breakPoint > cursor + CHUNK_SIZE * 0.6) {
        nextEnd = breakPoint + 1;
      }
    }

    chunks.push({
      ...source,
      content: content.slice(cursor, nextEnd).trim(),
      chunkIndex: chunks.length,
    });

    if (nextEnd >= content.length) {
      break;
    }

    cursor = Math.max(nextEnd - CHUNK_OVERLAP, cursor + 1);
  }

  return chunks.filter((chunk) => chunk.content.length > 40);
}

function buildStaticSources(locale: Locale): KnowledgeSource[] {
  const biographyText = [
    "Profil Biografi",
    ...about[locale],
    "Karya Buku",
    ...books.map((book) => `${book.year}: ${book.title[locale]}`),
  ].join("\n");

  const researchText = [
    "Agenda Riset",
    ...researchAgenda[locale],
    "Bidang Riset",
    ...researchAreas.map((area) =>
      [
        area.title[locale],
        area.subtitle?.[locale],
        area.description[locale],
      ].filter(Boolean).join(". ")
    ),
  ].join("\n");

  return [
    {
      sourceType: "static_page",
      sourceId: "biografi",
      locale,
      title: locale === "en" ? "BRH Biography" : "Biografi BRH",
      url: `/${locale}/biografi`,
      category: locale === "en" ? "Biography" : "Biografi",
      content: biographyText,
    },
    {
      sourceType: "static_page",
      sourceId: "riset",
      locale,
      title: locale === "en" ? "BRH Research" : "Riset BRH",
      url: `/${locale}/riset`,
      category: locale === "en" ? "Research" : "Riset",
      content: researchText,
    },
    ...journals.map((journal, index) => ({
      sourceType: "static_page" as const,
      sourceId: `journal-${index + 1}`,
      locale,
      title: journal.title,
      url: journal.url,
      category: locale === "en" ? "Journal" : "Jurnal",
      content: `${journal.year}. ${journal.title}. ${journal.reference}`,
    })),
  ];
}

export function getStaticKnowledgeSources(): KnowledgeSource[] {
  return [...buildStaticSources("en"), ...buildStaticSources("id")];
}
