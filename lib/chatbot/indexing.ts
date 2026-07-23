import { prisma } from "@/lib/prisma";
import { createEmbeddings } from "@/lib/ai/gemini";
import {
  KnowledgeSource,
  chunkSource,
  getStaticKnowledgeSources,
  htmlToText,
} from "@/lib/chatbot/content";
import { withLocale, type Locale } from "@/lib/i18n/config";
import { localizePost } from "@/lib/i18n/posts";

type PostBlock = {
  type: string;
  content?: string | null;
  contentEn?: string | null;
  title?: string | null;
  titleEn?: string | null;
  caption?: string | null;
  captionEn?: string | null;
  url?: string | null;
};

type KnowledgePost = {
  id: string;
  title: string;
  titleEn?: string | null;
  slug: string;
  slugEn?: string | null;
  category: string;
  thumbnail?: string | null;
  blocks: PostBlock[];
};

type IndexResult = {
  sourceId: string;
  locale: Locale;
  chunks: number;
};

const EMBEDDING_BATCH_SIZE = 32;
const QUICK_POST_TITLE_LIMIT = 72;

function postToKnowledgeSource(post: KnowledgePost, locale: Locale): KnowledgeSource {
  const localizedPost = localizePost(post, locale);
  const blocks = Array.isArray(localizedPost.blocks) ? localizedPost.blocks : [];
  const content = blocks
    .filter((block) => block.type === "text" && block.content)
    .map((block) => htmlToText(block.content || ""))
    .join("\n\n");

  return {
    sourceType: "post",
    sourceId: post.id,
    locale,
    title: localizedPost.title,
    url: withLocale(`/post/${localizedPost.slug}`, locale),
    category: localizedPost.category,
    thumbnail: post.thumbnail,
    content,
  };
}

function truncateTitle(value: string) {
  if (value.length <= QUICK_POST_TITLE_LIMIT) {
    return value;
  }

  return `${value.slice(0, QUICK_POST_TITLE_LIMIT).trim()}...`;
}

function quickPostToKnowledgeSource(quickPost: {
  id: string;
  type: string;
  content: string;
  imageUrl?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  locationLabel?: string | null;
}, locale: Locale): KnowledgeSource {
  const content = htmlToText(quickPost.content);
  const isQuote = quickPost.type === "QUOTE";
  const isAgenda = quickPost.type === "AGENDA";
  const label = isQuote
    ? (locale === "en" ? "BRH Quote" : "Kutipan BRH")
    : isAgenda
      ? (locale === "en" ? "BRH Agenda" : "Agenda BRH")
      : (locale === "en" ? "BRH Perspective" : "Pandangan BRH");
  const agendaDetails: string[] = [];

  if (isAgenda && quickPost.startsAt) {
    const dateFormatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
      dateStyle: "full",
      timeZone: "Asia/Jakarta",
    });
    const timeFormatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    });
    agendaDetails.push(`${locale === "en" ? "Date" : "Tanggal"}: ${dateFormatter.format(quickPost.startsAt)}`);
    agendaDetails.push(
      `${locale === "en" ? "Time" : "Waktu"}: ${timeFormatter.format(quickPost.startsAt)}`
      + (quickPost.endsAt ? `–${timeFormatter.format(quickPost.endsAt)}` : "")
      + " WIB",
    );
    if (quickPost.locationLabel) {
      agendaDetails.push(`${locale === "en" ? "Address" : "Alamat"}: ${quickPost.locationLabel}`);
    }
  }

  return {
    sourceType: "quick_post",
    sourceId: quickPost.id,
    locale,
    title: `${label}: ${truncateTitle(content)}`,
    url: `${withLocale("/catatan", locale)}#quick-post-${quickPost.id}`,
    category: isQuote
      ? (locale === "en" ? "Quote" : "Kutipan")
      : isAgenda
        ? (locale === "en" ? "Agenda" : "Agenda")
        : (locale === "en" ? "Perspective" : "Pandangan"),
    thumbnail: quickPost.type === "NORMAL" ? quickPost.imageUrl : null,
    content: [label, content, ...agendaDetails].join("\n"),
  };
}

async function replaceSourceChunks(source: KnowledgeSource): Promise<IndexResult> {
  const chunks = chunkSource(source);

  await prisma.knowledgeChunk.deleteMany({
    where: {
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      locale: source.locale,
    },
  });

  if (!chunks.length) {
    return { sourceId: source.sourceId, locale: source.locale, chunks: 0 };
  }

  for (let cursor = 0; cursor < chunks.length; cursor += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(cursor, cursor + EMBEDDING_BATCH_SIZE);
    const embeddings = await createEmbeddings(batch.map((chunk) => chunk.content));

    await prisma.knowledgeChunk.createMany({
      data: batch.map((chunk, index) => ({
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
        locale: chunk.locale,
        chunkIndex: chunk.chunkIndex,
        title: chunk.title,
        url: chunk.url,
        category: chunk.category || null,
        thumbnail: chunk.thumbnail || null,
        content: chunk.content,
        embedding: embeddings[index],
        indexedAt: new Date(),
      })),
    });
  }

  return { sourceId: source.sourceId, locale: source.locale, chunks: chunks.length };
}

export async function removePostFromKnowledgeIndex(postId: string) {
  await prisma.knowledgeChunk.deleteMany({
    where: {
      sourceType: "post",
      sourceId: postId,
    },
  });
}

export async function removeQuickPostFromKnowledgeIndex(quickPostId: string) {
  await prisma.knowledgeChunk.deleteMany({
    where: {
      sourceType: "quick_post",
      sourceId: quickPostId,
    },
  });
}

export async function indexPublishedPost(postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post || post.status !== "Published") {
    await removePostFromKnowledgeIndex(postId);
    return { sourceId: postId, chunks: 0 };
  }

  const idResult = await replaceSourceChunks(postToKnowledgeSource(post, "id"));
  const enResult = await replaceSourceChunks(postToKnowledgeSource(post, "en"));
  return { sourceId: postId, locale: "en" as const, chunks: idResult.chunks + enResult.chunks };
}

export async function indexPublishedQuickPost(quickPostId: string) {
  const quickPost = await prisma.quickPost.findUnique({ where: { id: quickPostId } });

  if (!quickPost || quickPost.status !== "Published") {
    await removeQuickPostFromKnowledgeIndex(quickPostId);
    return { sourceId: quickPostId, chunks: 0 };
  }

  const idResult = await replaceSourceChunks(quickPostToKnowledgeSource(quickPost, "id"));
  const enResult = await replaceSourceChunks(quickPostToKnowledgeSource(quickPost, "en"));
  return { sourceId: quickPostId, locale: "en" as const, chunks: idResult.chunks + enResult.chunks };
}

export async function indexStaticKnowledge() {
  const results: IndexResult[] = [];

  for (const source of getStaticKnowledgeSources()) {
    results.push(await replaceSourceChunks(source));
  }

  return results;
}

export async function indexAllKnowledge() {
  const [posts, quickPosts] = await Promise.all([
    prisma.post.findMany({
      where: { status: "Published" },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.quickPost.findMany({
      where: { status: "Published" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  await prisma.knowledgeChunk.deleteMany({});

  const results: IndexResult[] = [];
  for (const post of posts) {
    results.push(await replaceSourceChunks(postToKnowledgeSource(post, "id")));
    results.push(await replaceSourceChunks(postToKnowledgeSource(post, "en")));
  }

  for (const quickPost of quickPosts) {
    results.push(await replaceSourceChunks(quickPostToKnowledgeSource(quickPost, "id")));
    results.push(await replaceSourceChunks(quickPostToKnowledgeSource(quickPost, "en")));
  }

  results.push(...await indexStaticKnowledge());

  return {
    sources: results.length,
    chunks: results.reduce((total, result) => total + result.chunks, 0),
    results,
  };
}
