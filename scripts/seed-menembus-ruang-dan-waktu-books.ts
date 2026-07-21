import "dotenv/config";

import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const booksDirectory = path.join(process.cwd(), "material", "buku");
const targetFileNames = [
  "menembus-ruang-dan-waktu-ziarah-ke-irak.md",
  "menembus-ruang-dan-waktu-ziarah-eropa-untuk-peradaban-dunia.md",
] as const;

type BookMaterial = {
  title: string;
  slug: string;
  materialCategory: string;
  publishedAt: string;
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

  for (const field of ["title", "slug", "category", "publishedAt"] as const) {
    if (!metadata[field]) {
      throw new Error(`${fileName}: required field "${field}" is missing.`);
    }
  }

  if (fileName !== `${metadata.slug}.md`) {
    throw new Error(`${fileName}: filename must match the slug "${metadata.slug}.md".`);
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(metadata.publishedAt) ||
    Number.isNaN(Date.parse(`${metadata.publishedAt}T00:00:00.000Z`))
  ) {
    throw new Error(`${fileName}: publishedAt must use a valid YYYY-MM-DD date.`);
  }

  if (!match[2].trim()) {
    throw new Error(`${fileName}: book content is empty.`);
  }

  return {
    title: metadata.title,
    slug: metadata.slug,
    materialCategory: metadata.category,
    publishedAt: metadata.publishedAt,
    body: match[2].trim(),
  };
}

async function loadTargetBooks() {
  const books = await Promise.all(
    targetFileNames.map(async (fileName) => {
      const raw = await readFile(path.join(booksDirectory, fileName), "utf8");
      return parseBookMaterial(fileName, raw);
    }),
  );

  const slugs = new Set(books.map((book) => book.slug));
  if (slugs.size !== books.length) {
    throw new Error("The Menembus Ruang dan Waktu material contains duplicate slugs.");
  }

  return books;
}

async function assertNoPostCollisions(books: BookMaterial[]) {
  const existingPosts = await prisma.post.findMany({
    where: {
      OR: [
        { slug: { in: books.map((book) => book.slug) } },
        { title: { in: books.map((book) => book.title) } },
      ],
    },
    select: { slug: true, title: true },
  });

  for (const existingPost of existingPosts) {
    const bookWithSameTitle = books.find((book) => book.title === existingPost.title);
    if (bookWithSameTitle && bookWithSameTitle.slug !== existingPost.slug) {
      throw new Error(
        `Refusing to seed duplicate title "${existingPost.title}" at slug "${bookWithSameTitle.slug}" because it already exists at "${existingPost.slug}".`,
      );
    }
  }
}

async function main() {
  const books = await loadTargetBooks();

  if (process.argv.includes("--check")) {
    for (const book of books) {
      markdownToHtml(book.body);
      console.log(`Validated: ${book.title} (${book.publishedAt})`);
    }
    console.log(`Validated ${books.length} targeted book materials without writing to the database.`);
    return;
  }

  await assertNoPostCollisions(books);
  console.log(`Seeding ${books.length} Menembus Ruang dan Waktu books as drafts...`);

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
        publishedAt: new Date(`${book.publishedAt}T00:00:00.000Z`),
        blocks,
      },
      create: {
        title: book.title,
        slug: book.slug,
        category: "Buku",
        status: "Draft",
        publishedAt: new Date(`${book.publishedAt}T00:00:00.000Z`),
        blocks,
      },
    });

    console.log(
      `Upserted draft: ${book.title} (${book.materialCategory}; ${book.publishedAt})`,
    );
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
  const booksBySlug = new Map(books.map((book) => [book.slug, book]));
  const invalidPosts = seededPosts.filter((post) => {
    const expectedDate = booksBySlug.get(post.slug)?.publishedAt;
    const actualDate = post.publishedAt?.toISOString().slice(0, 10);
    return (
      post.category !== "Buku" ||
      post.status !== "Draft" ||
      actualDate !== expectedDate ||
      post.blocks.length !== 1 ||
      post.blocks[0].type !== "text" ||
      !post.blocks[0].content
    );
  });

  if (seededPosts.length !== books.length || invalidPosts.length > 0) {
    throw new Error(
      `Draft verification failed: found ${seededPosts.length}/${books.length} posts and ${invalidPosts.length} invalid posts.`,
    );
  }

  console.log("Verified both targeted posts as dated drafts with populated content.");
}

main()
  .catch((error) => {
    console.error("Menembus Ruang dan Waktu seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
