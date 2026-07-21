import "dotenv/config";

import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const targetFileName = "tuntunan-sholat-thoriqoh.md";
const targetFilePath = path.join(process.cwd(), "material", "buku", targetFileName);

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

function parseBookMaterial(raw: string): BookMaterial {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`${targetFileName}: front matter is missing or malformed.`);
  }

  const metadata = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(":");
        if (separator < 1) {
          throw new Error(`${targetFileName}: invalid front matter line: ${line}`);
        }
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );

  for (const field of ["title", "slug", "category", "publishedAt"] as const) {
    if (!metadata[field]) {
      throw new Error(`${targetFileName}: required field "${field}" is missing.`);
    }
  }

  if (targetFileName !== `${metadata.slug}.md`) {
    throw new Error(
      `${targetFileName}: filename must match the slug "${metadata.slug}.md".`,
    );
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(metadata.publishedAt) ||
    Number.isNaN(Date.parse(`${metadata.publishedAt}T00:00:00.000Z`))
  ) {
    throw new Error(`${targetFileName}: publishedAt must use a valid YYYY-MM-DD date.`);
  }

  if (!match[2].trim()) {
    throw new Error(`${targetFileName}: book content is empty.`);
  }

  return {
    title: metadata.title,
    slug: metadata.slug,
    materialCategory: metadata.category,
    publishedAt: metadata.publishedAt,
    body: match[2].trim(),
  };
}

function postMatchesSeed(
  post: {
    title: string;
    slug: string;
    category: string;
    status: string;
    publishedAt: Date | null;
    blocks: Array<{ type: string; content: string }>;
  },
  book: BookMaterial,
  expectedContent: string,
) {
  return (
    post.title === book.title &&
    post.slug === book.slug &&
    post.category === "Buku" &&
    post.status === "Draft" &&
    post.publishedAt?.toISOString().slice(0, 10) === book.publishedAt &&
    post.blocks.length === 1 &&
    post.blocks[0].type === "text" &&
    post.blocks[0].content === expectedContent
  );
}

async function main() {
  const raw = await readFile(targetFilePath, "utf8");
  const book = parseBookMaterial(raw);
  const expectedContent = markdownToHtml(book.body);

  if (process.argv.includes("--check")) {
    console.log(`Validated: ${book.title} (${book.publishedAt})`);
    console.log("No database writes were performed.");
    return;
  }

  const conflictingPosts = await prisma.post.findMany({
    where: {
      OR: [{ slug: book.slug }, { title: book.title }],
    },
    select: {
      title: true,
      slug: true,
      category: true,
      status: true,
      publishedAt: true,
      blocks: true,
    },
  });

  if (conflictingPosts.length > 0) {
    const exactSeed = conflictingPosts.find((post) =>
      postMatchesSeed(post, book, expectedContent),
    );
    if (conflictingPosts.length === 1 && exactSeed) {
      console.log(`Already seeded and unchanged: ${book.title}`);
      return;
    }

    const conflicts = conflictingPosts
      .map((post) => `${post.title} (${post.slug})`)
      .join(", ");
    throw new Error(
      `Refusing to modify existing post data. Resolve the title/slug conflict first: ${conflicts}`,
    );
  }

  await prisma.post.create({
    data: {
      title: book.title,
      slug: book.slug,
      category: "Buku",
      status: "Draft",
      publishedAt: new Date(`${book.publishedAt}T00:00:00.000Z`),
      blocks: [
        {
          id: randomUUID(),
          type: "text",
          content: expectedContent,
        },
      ],
    },
  });

  const seededPost = await prisma.post.findUnique({
    where: { slug: book.slug },
    select: {
      title: true,
      slug: true,
      category: true,
      status: true,
      publishedAt: true,
      blocks: true,
    },
  });

  if (!seededPost || !postMatchesSeed(seededPost, book, expectedContent)) {
    throw new Error("Draft verification failed after creating the post.");
  }

  console.log(
    `Created draft: ${book.title} (${book.materialCategory}; ${book.publishedAt})`,
  );
  console.log("Verified the exact draft record without updating any existing post.");
}

main()
  .catch((error) => {
    console.error("Tuntunan Sholat Thoriqoh seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
