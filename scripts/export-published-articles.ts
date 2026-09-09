import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const outputDirectory = path.join(process.cwd(), "material", "artikel", "Published");

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToReadableMarkdown(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "> $1\n\n")
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
      .replace(/<\/(ul|ol)>/gi, "\n")
      .replace(/<(ul|ol)[^>]*>/gi, "")
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")
      .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
      .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

async function main() {
  const posts = await prisma.post.findMany({
    where: { category: "Artikel", status: "Published" },
    orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
  });

  await mkdir(outputDirectory, { recursive: true });

  const exactExport = {
    exportedAt: new Date().toISOString(),
    filter: { category: "Artikel", status: "Published" },
    count: posts.length,
    posts,
  };

  const readableSections = posts.map((post, index) => {
    const date = post.publishedAt?.toISOString() ?? "tanggal tidak tersedia";
    const blocks = post.blocks
      .map((block) => {
        if (block.type === "text") {
          return htmlToReadableMarkdown(block.content);
        }

        if (block.type === "image" && block.url) {
          const alt = block.title || block.caption || post.title.trim();
          return `![${alt}](${block.url})`;
        }

        const label = block.title || block.caption || block.content || block.type;
        return `- **Blok ${block.type}:** ${label}${block.url ? ` — ${block.url}` : ""}`;
      })
      .filter(Boolean)
      .join("\n\n");

    return [
      `# ${index + 1}. ${post.title.trim()}`,
      "",
      `- Slug: \`${post.slug}\``,
      `- Terbit: ${date}`,
      `- Thumbnail: ${post.thumbnail ?? "-"}`,
      "",
      blocks,
    ].join("\n");
  });

  const readableExport = [
    "# Arsip Artikel Published",
    "",
    "> Hasil ekstraksi read-only dari koleksi `Post` dengan filter `category = Artikel` dan `status = Published`.",
    `> Jumlah artikel: ${posts.length}. Waktu ekstraksi tercatat pada berkas JSON pendamping.`,
    "",
    ...readableSections.flatMap((section) => [section, "", "---", ""]),
  ].join("\n");

  await Promise.all([
    writeFile(
      path.join(outputDirectory, "published-articles.json"),
      `${JSON.stringify(exactExport, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(outputDirectory, "published-articles.md"),
      readableExport,
      "utf8",
    ),
  ]);

  console.log(`Exported ${posts.length} published articles to ${outputDirectory}`);
}

main()
  .catch((error) => {
    console.error("Published article export failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
