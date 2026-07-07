import { prisma } from "@/lib/prisma";
import { createEmbeddings } from "@/lib/ai/gemini";
import {
  KnowledgeSource,
  chunkSource,
  getStaticKnowledgeSources,
  htmlToText,
} from "@/lib/chatbot/content";
import type { Locale } from "@/lib/i18n/config";
import { localizePost } from "@/lib/i18n/posts";

type PostBlock = {
  type: string;
  content?: string | null;
  title?: string | null;
  caption?: string | null;
  url?: string | null;
};

type IndexResult = {
  sourceId: string;
  locale: Locale;
  chunks: number;
};

const EMBEDDING_BATCH_SIZE = 32;
const QUICK_POST_TITLE_LIMIT = 72;

function postToKnowledgeSource(post: {
  id: string;
  title: string;
  slug: string;
  slugEn?: string | null;
  category: string;
  thumbnail?: string | null;
  blocks: unknown;
}, locale: Locale): KnowledgeSource {
  const localizedPost = localizePost(post as any, locale);
  const blocks = Array.isArray(localizedPost.blocks) ? (localizedPost.blocks as PostBlock[]) : [];
  const content = blocks
    .filter((block) => block.type === "text" && block.content)
    .map((block) => htmlToText(block.content || ""))
    .join("\n\n");

  return {
    sourceType: "post",
    sourceId: post.id,
    locale,
    title: localizedPost.title,
    url: `/${locale}/post/${localizedPost.slug}`,
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
}, locale: Locale): KnowledgeSource {
  const content = htmlToText(quickPost.content);
  const isQuote = quickPost.type === "QUOTE";
  const label = isQuote ? (locale === "en" ? "BRH Quote" : "Kutipan BRH") : "BRH Notes";

  return {
    sourceType: "quick_post",
    sourceId: quickPost.id,
    locale,
    title: `${label}: ${truncateTitle(content)}`,
    url: `/${locale}/catatan#quick-post-${quickPost.id}`,
    category: isQuote ? (locale === "en" ? "Quote" : "Kutipan") : "BRH Notes",
    thumbnail: isQuote ? null : quickPost.imageUrl,
    content: [label, content].join("\n"),
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

  const idResult = await replaceSourceChunks(postToKnowledgeSource(post as any, "id"));
  const enResult = await replaceSourceChunks(postToKnowledgeSource(post as any, "en"));
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
    results.push(await replaceSourceChunks(postToKnowledgeSource(post as any, "id")));
    results.push(await replaceSourceChunks(postToKnowledgeSource(post as any, "en")));
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
