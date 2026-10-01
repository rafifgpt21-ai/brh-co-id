import { revalidateImportedContent } from "./revalidate-content";
import "dotenv/config";

import { randomUUID } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const seriesName = "Amanah yang Bernapas";
const seriesDirectoryName = "seri-iii-september-oktober-2026";
const firstPublishedAt = "2026-09-21T12:00:00.000Z";
const materialDirectory = path.join(
  process.cwd(),
  "material",
  "artikel",
  "Planned",
  seriesDirectoryName,
);

const articleFiles = [
  "tubuh-yang-berkabar.md",
  "cicilan-atas-keinginan.md",
  "upah-yang-tak-terlihat.md",
  "piring-yang-mengingat.md",
  "rumah-yang-menopang.md",
  "kota-yang-menyapa.md",
  "warisan-di-awan.md",
  "ketika-mesin-memilih.md",
  "cemas-menjaga-bumi.md",
  "tangga-yang-bertanya.md",
  "masa-depan-menitip.md",
] as const;

type ArticleMaterial = {
  title: string;
  slug: string;
  category: string;
  status: "Published" | "Draft";
  author: string;
  series: string;
  publishedAt: string;
  image: string;
  paragraphs: string[];
  wordCount: number;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+?)\*/g, "<em>$1</em>");
}

function renderParagraphs(paragraphs: string[]) {
  return paragraphs
    .map((paragraph) => `<p>${renderInlineMarkdown(paragraph)}</p>`)
    .join("");
}

function parseFrontMatter(raw: string, fileName: string) {
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

  return { metadata, body: match[2].trim() };
}

async function parseArticle(fileName: string): Promise<ArticleMaterial> {
  const filePath = path.join(materialDirectory, fileName);
  const raw = await readFile(filePath, "utf8");
  const { metadata, body } = parseFrontMatter(raw, fileName);
  const requiredFields = [
    "title",
    "slug",
    "category",
    "status",
    "author",
    "series",
    "publishedAt",
    "image",
  ] as const;

  for (const field of requiredFields) {
    if (!metadata[field]) {
      throw new Error(`${fileName}: required field "${field}" is missing.`);
    }
  }

  if (fileName !== `${metadata.slug}.md`) {
    throw new Error(`${fileName}: filename must match slug "${metadata.slug}".`);
  }
  if (metadata.category !== "Artikel") {
    throw new Error(`${fileName}: category must be Artikel.`);
  }
  if (metadata.author !== "Budi Rahman Hakim, Ph.D.") {
    throw new Error(`${fileName}: unexpected author value.`);
  }
  if (metadata.series !== seriesName) {
    throw new Error(`${fileName}: series must be ${seriesName}.`);
  }
  if (metadata.title.trim().split(/\s+/).length > 4) {
    throw new Error(`${fileName}: title must contain at most four words.`);
  }
  if (
    !/^2026-\d{2}-\d{2}T12:00:00\.000Z$/.test(metadata.publishedAt) ||
    Number.isNaN(Date.parse(metadata.publishedAt))
  ) {
    throw new Error(`${fileName}: publishedAt must be a valid 2026 date at 12:00:00Z.`);
  }

  const expectedImagePrefix = `/images/articles/${seriesDirectoryName}/`;
  if (!metadata.image.startsWith(expectedImagePrefix)) {
    throw new Error(`${fileName}: image must use ${expectedImagePrefix}.`);
  }
  const imagePath = path.join(process.cwd(), "public", metadata.image.replace(/^\//, ""));
  await access(imagePath);

  const paragraphs = body.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim());
  if (paragraphs.length !== 9 || paragraphs.some((paragraph) => !paragraph)) {
    throw new Error(`${fileName}: article must contain exactly nine non-empty paragraphs.`);
  }

  const wordCount = body
    .replace(/\*+/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (wordCount < 650 || wordCount > 850) {
    throw new Error(`${fileName}: expected 650–850 words, found ${wordCount}.`);
  }
  if (!/\*\*[^*]+\*\*$/.test(paragraphs[8])) {
    throw new Error(`${fileName}: final sentence must be the bold hikmah inti.`);
  }

  return {
    title: metadata.title,
    slug: metadata.slug,
    category: metadata.category,
    status: metadata.status as ArticleMaterial["status"],
    author: metadata.author,
    series: metadata.series,
    publishedAt: metadata.publishedAt,
    image: metadata.image,
    paragraphs,
    wordCount,
  };
}

function validateSchedule(articles: ArticleMaterial[]) {
  const expectedFirstDate = Date.parse(firstPublishedAt);
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const seenTitles = new Set<string>();
  const seenSlugs = new Set<string>();

  articles.forEach((article, index) => {
    const expectedDate = expectedFirstDate + index * threeDays;
    if (Date.parse(article.publishedAt) !== expectedDate) {
      throw new Error(
        `${article.slug}: schedule must start on 21 September 2026 and repeat every three days.`,
      );
    }

    const expectedStatus = index === 0 ? "Published" : "Draft";
    if (article.status !== expectedStatus) {
      throw new Error(
        `${article.slug}: expected ${expectedStatus} status for schedule position ${index + 1}.`,
      );
    }
    if (seenTitles.has(article.title) || seenSlugs.has(article.slug)) {
      throw new Error(`${article.slug}: duplicate title or slug inside the package.`);
    }
    seenTitles.add(article.title);
    seenSlugs.add(article.slug);
  });
}

async function applyPosts(articles: ArticleMaterial[]) {
  const conflicts = await prisma.post.findMany({
    where: {
      OR: [
        { slug: { in: articles.map((article) => article.slug) } },
        { title: { in: articles.map((article) => article.title) } },
      ],
    },
    select: { title: true, slug: true, status: true },
  });

  if (conflicts.length > 0) {
    const details = conflicts
      .map((post) => `${post.title} (${post.slug}; ${post.status})`)
      .join(", ");
    throw new Error(`Refusing to modify existing posts. Resolve conflicts first: ${details}`);
  }

  await prisma.$transaction(
    articles.map((article) =>
      prisma.post.create({
        data: {
          title: article.title,
          slug: article.slug,
          category: "Artikel",
          status: article.status,
          publishedAt: new Date(article.publishedAt),
          thumbnail: article.image,
          blocks: [
            {
              id: randomUUID(),
              type: "text",
              content: [
                `<p><strong>${escapeHtml(article.author)}</strong></p>`,
                renderParagraphs(article.paragraphs.slice(0, 1)),
              ].join(""),
            },
            {
              id: randomUUID(),
              type: "image",
              content: "",
              url: article.image,
            },
            {
              id: randomUUID(),
              type: "text",
              content: renderParagraphs(article.paragraphs.slice(1)),
            },
          ],
        },
      }),
    ),
  );

  const createdPosts = await prisma.post.findMany({
    where: { slug: { in: articles.map((article) => article.slug) } },
    select: {
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      thumbnail: true,
      blocks: true,
    },
  });

  for (const article of articles) {
    const post = createdPosts.find((candidate) => candidate.slug === article.slug);
    const matches =
      post?.title === article.title &&
      post.status === article.status &&
      post.publishedAt?.toISOString() === article.publishedAt &&
      post.thumbnail === article.image &&
      post.blocks.length === 3 &&
      post.blocks.map((block) => block.type).join(">") === "text>image>text" &&
      post.blocks[1].url === article.image;

    if (!matches) {
      throw new Error(`Post-seed verification failed for ${article.slug}.`);
    }
  }

  console.log(
    `Created and verified ${articles.length} articles (1 Published, ${articles.length - 1} Draft).`,
  );
}

async function main() {
  const articles = await Promise.all(articleFiles.map(parseArticle));
  articles.sort((left, right) => left.publishedAt.localeCompare(right.publishedAt));
  validateSchedule(articles);

  console.log("Validated Seri III September–October 2026 package:");
  for (const article of articles) {
    console.log(
      `- ${article.publishedAt.slice(0, 10)} — ${article.title} [${article.status}; ${article.wordCount} words]`,
    );
  }

  if (!process.argv.includes("--apply")) {
    console.log("No database writes were performed. Pass --apply to seed this package.");
    return;
  }

  await applyPosts(articles);
  await revalidateImportedContent();
}

main()
  .catch((error) => {
    console.error("Seri III September–October 2026 preparation failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
