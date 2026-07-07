import "dotenv/config";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { featuredBooks, type FeaturedBook } from "../lib/featured-books";

const prisma = new PrismaClient();

function list(items: string[]) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function paragraph(text?: string) {
  return text ? `<p>${text}</p>` : "";
}

function metaRows(book: FeaturedBook, language: "id" | "en") {
  const labels =
    language === "id"
      ? {
          title: "Identitas Buku",
          bookTitle: "Judul",
          subtitle: "Sub-Judul",
          author: "Penulis",
          publisher: "Penerbit",
          category: "Kategori",
          preface: "Kata Pengantar",
          prolog: "Prolog",
          year: "Tahun",
        }
      : {
          title: "Book Details",
          bookTitle: "Title",
          subtitle: "Subtitle",
          author: "Author",
          publisher: "Publisher",
          category: "Category",
          preface: "Preface",
          prolog: "Prologue",
          year: "Year",
        };

  const rows = [
    [labels.bookTitle, book.title[language]],
    [labels.subtitle, book.subtitle?.[language]],
    [labels.author, book.author],
    [labels.publisher, book.publisher],
    [labels.category, book.category[language]],
    [labels.preface, book.preface?.[language]],
    [labels.prolog, book.prolog?.[language]],
    [labels.year, book.year],
  ].filter(([, value]) => value);

  return `<h2>${labels.title}</h2><ul>${rows
    .map(([label, value]) => `<li><strong>${label}:</strong> ${value}</li>`)
    .join("")}</ul>`;
}

function quoteBlock(book: FeaturedBook, language: "id" | "en") {
  if (book.quotes.length === 0) return "";

  const title = language === "id" ? "Kutipan Inspiratif" : "Selected Quotes";
  return `<h2>${title}</h2>${book.quotes
    .map(
      (quote) =>
        `<blockquote><p>${quote.text[language]}</p><cite>${quote.author}</cite></blockquote>`,
    )
    .join("")}`;
}

function contentFor(book: FeaturedBook, language: "id" | "en") {
  const labels =
    language === "id"
      ? {
          intro: "Sinopsis Utama",
          highlights: "Poin Pembahasan Utama",
          audience: "Target Pembaca",
        }
      : {
          intro: "Overview",
          highlights: "Key Discussions",
          audience: "Recommended Readers",
        };

  return [
    `<h2>${labels.intro}</h2>`,
    paragraph(book.summary[language]),
    metaRows(book, language),
    `<h2>${labels.highlights}</h2>`,
    list(book.highlights[language]),
    `<h2>${labels.audience}</h2>`,
    list(book.audience[language]),
    quoteBlock(book, language),
  ].join("");
}

function blocksFor(book: FeaturedBook) {
  return [
    {
      id: randomUUID(),
      type: "text",
      content: contentFor(book, "id"),
      contentEn: contentFor(book, "en"),
    },
    {
      id: randomUUID(),
      type: "image",
      content: book.cover,
      contentEn: book.cover,
      url: book.cover,
      title: book.title.id,
      titleEn: book.title.en,
      caption: `Cover buku ${book.title.id}`,
      captionEn: `${book.title.en} book cover`,
    },
    {
      id: randomUUID(),
      type: "link",
      content: book.referenceLink.url,
      contentEn: book.referenceLink.url,
      url: book.referenceLink.url,
      title: book.referenceLink.title.id,
      titleEn: book.referenceLink.title.en,
      caption: book.referenceLink.caption.id,
      captionEn: book.referenceLink.caption.en,
    },
  ];
}

async function main() {
  console.log("Seeding material book posts...");

  for (const book of featuredBooks) {
    await prisma.post.upsert({
      where: { slug: book.slug },
      update: {
        title: book.title.id,
        titleEn: book.title.en,
        slugEn: book.slugEn,
        category: "Buku",
        status: "Published",
        thumbnail: book.cover,
        blocks: blocksFor(book),
      },
      create: {
        title: book.title.id,
        titleEn: book.title.en,
        slug: book.slug,
        slugEn: book.slugEn,
        category: "Buku",
        status: "Published",
        thumbnail: book.cover,
        blocks: blocksFor(book),
      },
    });

    console.log(`Upserted: ${book.title.id}`);
  }

  console.log(`Done. Upserted ${featuredBooks.length} material book posts.`);
}

main()
  .catch((error) => {
    console.error("Material book seed failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
