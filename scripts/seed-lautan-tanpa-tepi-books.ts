import "dotenv/config";

import { randomUUID } from "crypto";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const booksDirectory = path.join(process.cwd(), "material", "buku");

type BookMaterial = {
  title: string;
  slug: string;
  category: string;
  body: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+?)\*/g, "<em>$1</em>");
}

function markdownToHtml(markdown: string) {
  const html: string[] = [];
  let paragraph: string[] = [];
  let listType: "ol" | "ul" | null = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    html.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  }

  for (const rawLine of markdown.replaceAll("\r\n", "\n").split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^(#{2,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const orderedItem = line.match(/^\d+\.\s+(.+)$/);
    const unorderedItem = line.match(/^[-*]\s+(.+)$/);
    const listItem = orderedItem ?? unorderedItem;

    if (listItem) {
      flushParagraph();
      const nextListType = orderedItem ? "ol" : "ul";
      if (listType !== nextListType) {
        closeList();
        html.push(`<${nextListType}>`);
        listType = nextListType;
      }
      html.push(`<li>${renderInlineMarkdown(listItem[1])}</li>`);
      continue;
    }

    closeList();
    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  return html.join("");
}

function parseBookMaterial(fileName: string, raw: string): BookMaterial {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`${fileName}: front matter is missing or malformed.`);
  }

  const metadata = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(":");
        if (separator < 1) {
          throw new Error(`${fileName}: invalid front matter line: ${line}`);
        }
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );

  for (const field of ["title", "slug", "category"] as const) {
    if (!metadata[field]) {
      throw new Error(`${fileName}: required field "${field}" is missing.`);
    }
  }

  if (fileName !== `${metadata.slug}.md`) {
    throw new Error(`${fileName}: filename must match the slug "${metadata.slug}.md".`);
  }

  return {
    title: metadata.title,
    slug: metadata.slug,
    category: metadata.category,
    body: match[2].trim(),
  };
}

async function loadBooks() {
  const fileNames = (await readdir(booksDirectory))
    .filter((fileName) => fileName.endsWith(".md"))
    .sort();
  const books = await Promise.all(
    fileNames.map(async (fileName) => {
      const raw = await readFile(path.join(booksDirectory, fileName), "utf8");
      return parseBookMaterial(fileName, raw);
    }),
  );

  const slugs = new Set<string>();
  for (const book of books) {
    if (slugs.has(book.slug)) {
      throw new Error(`Duplicate slug found: ${book.slug}`);
    }
    slugs.add(book.slug);
  }

  if (books.length === 0) {
    throw new Error(`No Markdown files found in ${booksDirectory}.`);
  }

  return books;
}

async function main() {
  const books = await loadBooks();
  console.log(`Seeding ${books.length} Seri Lautan Tanpa Tepi books as drafts...`);

  for (const book of books) {
    const blocks = [
      {
        id: randomUUID(),
        type: "text",
        content: markdownToHtml(book.body),
      },
    ];

    await prisma.post.upsert({
      where: { slug: book.slug },
      update: {
        title: book.title,
        category: "Buku",
        status: "Draft",
        publishedAt: null,
        blocks,
      },
      create: {
        title: book.title,
        slug: book.slug,
        category: "Buku",
        status: "Draft",
        blocks,
      },
    });

    console.log(`Upserted draft: ${book.title} (${book.category})`);
  }

  const seededPosts = await prisma.post.findMany({
    where: { slug: { in: books.map((book) => book.slug) } },
    select: {
      slug: true,
      category: true,
      status: true,
      publishedAt: true,
      blocks: true,
    },
  });
  const invalidPosts = seededPosts.filter(
    (post) =>
      post.category !== "Buku" ||
      post.status !== "Draft" ||
      post.publishedAt !== null ||
      post.blocks.length === 0,
  );

  if (seededPosts.length !== books.length || invalidPosts.length > 0) {
    throw new Error(
      `Draft verification failed: found ${seededPosts.length}/${books.length} posts and ${invalidPosts.length} invalid posts.`,
    );
  }

  console.log("Verified: every seeded book is a draft with post content.");
  console.log(`Done. Upserted ${books.length} draft book posts.`);
}

main()
  .catch((error) => {
    console.error("Seri Lautan Tanpa Tepi seed failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
