import { prisma } from "@/lib/prisma";
import { createEmbedding } from "@/lib/ai/gemini";
import type { Locale } from "@/lib/i18n/config";

export type ChatSource = {
  title: string;
  url: string;
  category?: string | null;
  thumbnail?: string | null;
  excerpt?: string;
  sourceType: string;
};

export type RetrievedChunk = ChatSource & {
  content: string;
  score?: number;
};

type MongoVectorSearchResult = {
  cursor?: {
    firstBatch?: RetrievedChunk[];
  };
};

const VECTOR_INDEX_NAME = process.env.CHAT_VECTOR_INDEX_NAME || "knowledge_embedding_vector_index";

function normalizeSourceKey(source: ChatSource) {
  return `${source.sourceType}:${source.url}`;
}

function uniqueSources(chunks: RetrievedChunk[]) {
  const seen = new Set<string>();
  const sources: ChatSource[] = [];

  for (const chunk of chunks) {
    const key = normalizeSourceKey(chunk);
    if (!seen.has(key)) {
      seen.add(key);
      sources.push({
        title: chunk.title,
        url: chunk.url,
        category: chunk.category,
        thumbnail: chunk.thumbnail,
        excerpt: chunk.content.slice(0, 150),
        sourceType: chunk.sourceType,
      });
    }
  }

  return sources;
}

function mergeChunks(...groups: RetrievedChunk[][]) {
  const seen = new Set<string>();
  const merged: RetrievedChunk[] = [];

  for (const group of groups) {
    for (const chunk of group) {
      const key = `${chunk.sourceType}:${chunk.url}:${chunk.content.slice(0, 80)}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(chunk);
      }
    }
  }

  return merged;
}

function extractQuotedPhrases(query: string) {
  const phrases = Array.from(query.matchAll(/["“”']([^"“”']{8,})["“”']/g))
    .map((match) => match[1].trim())
    .filter(Boolean);

  return Array.from(new Set([
    ...phrases,
    ...phrases.map((phrase) => phrase.replace(/^(judul|title)\s+/i, "").trim()),
  ].filter((phrase) => phrase.length > 7)));
}

function extractPaths(query: string) {
  return Array.from(query.matchAll(/\/post\/[A-Za-z0-9-_%]+/g))
    .map((match) => match[0])
    .filter(Boolean);
}

function mapChunk(chunk: {
  sourceType: string;
  title: string;
  url: string;
  category: string | null;
  thumbnail: string | null;
  content: string;
  score?: number;
}): RetrievedChunk {
  return {
    sourceType: chunk.sourceType,
    title: chunk.title,
    url: chunk.url,
    category: chunk.category,
    thumbnail: chunk.thumbnail,
    content: chunk.content,
    score: chunk.score,
  };
}

async function exactPathSearch(query: string, limit: number, locale: Locale) {
  const paths = extractPaths(query);
  if (!paths.length) {
    return [];
  }

  const chunks = await prisma.knowledgeChunk.findMany({
    where: {
      locale,
      OR: paths.map((path) => ({ url: path })),
    },
    take: limit,
    orderBy: { chunkIndex: "asc" },
  });

  return chunks.map((chunk) => mapChunk({ ...chunk, score: 1 }));
}

async function exactTitleSearch(query: string, limit: number, locale: Locale) {
  const phrases = extractQuotedPhrases(query);
  if (!phrases.length) {
    return [];
  }

  const chunks = await prisma.knowledgeChunk.findMany({
    where: {
      OR: phrases.map((phrase) => ({
        title: { contains: phrase, mode: "insensitive" },
      })),
      locale,
    },
    take: limit,
    orderBy: { indexedAt: "desc" },
  });

  return chunks.map((chunk) => mapChunk({ ...chunk, score: 1 }));
}

async function vectorSearch(query: string, limit: number, locale: Locale) {
  const queryVector = await createEmbedding(query);
  const result = await prisma.$runCommandRaw({
    aggregate: "KnowledgeChunk",
    pipeline: [
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector,
          filter: { locale },
          numCandidates: 100,
          limit,
        },
      },
      {
        $project: {
          _id: 0,
          sourceType: 1,
          title: 1,
          url: 1,
          category: 1,
          thumbnail: 1,
          content: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ],
    cursor: {},
  }) as MongoVectorSearchResult;

  return result.cursor?.firstBatch || [];
}

async function keywordFallbackSearch(query: string, limit: number, locale: Locale) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.replace(/[^\w-]/g, ""))
    .filter((term) => term.length > 3)
    .slice(0, 6);

  if (!terms.length) {
    return [];
  }

  const chunks = await prisma.knowledgeChunk.findMany({
    where: {
      locale,
      OR: terms.flatMap((term) => [
        { title: { contains: term, mode: "insensitive" } },
        { content: { contains: term, mode: "insensitive" } },
        { category: { contains: term, mode: "insensitive" } },
      ]),
    },
    take: limit,
    orderBy: { indexedAt: "desc" },
  });

  return chunks.map(mapChunk);
}

export async function retrieveKnowledge(query: string, limit = 6, locale: Locale = "en") {
  let vectorChunks: RetrievedChunk[] = [];

  try {
    vectorChunks = await vectorSearch(query, limit, locale);
  } catch (error) {
    console.warn("Vector search unavailable, falling back to keyword search:", error);
  }

  const exactPathChunks = await exactPathSearch(query, limit, locale);
  const exactChunks = await exactTitleSearch(query, limit, locale);
  const keywordChunks = await keywordFallbackSearch(query, limit, locale);
  const chunks = mergeChunks(exactPathChunks, exactChunks, keywordChunks, vectorChunks).slice(0, limit);

  return {
    chunks,
    sources: uniqueSources(chunks),
    context: chunks
      .map((chunk, index) => [
        `[Sumber ${index + 1}] ${chunk.title}`,
        `URL: ${chunk.url}`,
        chunk.category ? `Kategori: ${chunk.category}` : null,
        `Isi: ${chunk.content}`,
      ].filter(Boolean).join("\n"))
      .join("\n\n"),
  };
}
