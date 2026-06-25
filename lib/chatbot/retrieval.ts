import { prisma } from "@/lib/prisma";
import { createEmbedding } from "@/lib/ai/gemini";
import type { Locale } from "@/lib/i18n/config";

export type ChatSource = {
  sourceId?: string;
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

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/#/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactSearchText(value: string) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

function normalizeSourceKey(source: ChatSource) {
  return `${source.sourceType}:${source.sourceId || source.url}`;
}

function uniqueSources(chunks: RetrievedChunk[]) {
  const seen = new Set<string>();
  const sources: ChatSource[] = [];

  for (const chunk of chunks) {
    const key = normalizeSourceKey(chunk);
    if (!seen.has(key)) {
      seen.add(key);
      sources.push({
        sourceId: chunk.sourceId,
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
      const key = `${chunk.sourceType}:${chunk.sourceId || chunk.url}:${chunk.content.slice(0, 80)}`;
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

function extractTitleCandidates(query: string) {
  const normalized = normalizeSearchText(query)
    .replace(/\b(bagaimana|tentang|mengenai|adakah|ada|artikel|judul|dengan|yang|apa|isi|dari|ini|itu)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = normalized.split(/\s+/).filter((word) => word.length > 2);
  const candidates = new Set<string>(extractQuotedPhrases(query).map(normalizeSearchText));

  for (let size = Math.min(8, words.length); size >= 3; size--) {
    for (let index = 0; index <= words.length - size; index++) {
      candidates.add(words.slice(index, index + size).join(" "));
    }
  }

  if (normalized.length > 7) {
    candidates.add(normalized);
  }

  return Array.from(candidates).filter((candidate) => candidate.length > 7);
}

function extractPaths(query: string) {
  return Array.from(query.matchAll(/\/post\/[A-Za-z0-9-_%]+/g))
    .map((match) => match[0])
    .filter(Boolean);
}

function mapChunk(chunk: {
  sourceId?: string | null;
  sourceType: string;
  title: string;
  url: string;
  category: string | null;
  thumbnail: string | null;
  content: string;
  score?: number;
}): RetrievedChunk {
  return {
    sourceId: chunk.sourceId || undefined,
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
  const phrases = extractTitleCandidates(query);
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

  const compactPhrases = phrases.map(compactSearchText);

  return chunks
    .map((chunk) => {
      const title = normalizeSearchText(chunk.title);
      const compactTitle = compactSearchText(chunk.title);
      const exactScore = phrases.some((phrase) => title.includes(phrase)) ? 30 : 0;
      const compactScore = compactPhrases.some((phrase) => compactTitle.includes(phrase)) ? 24 : 0;

      return mapChunk({ ...chunk, score: exactScore + compactScore });
    })
    .filter((chunk) => (chunk.score || 0) > 0)
    .sort((left, right) => (right.score || 0) - (left.score || 0))
    .slice(0, limit);
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
          sourceId: 1,
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
  const terms = normalizeSearchText(query)
    .split(/\s+/)
    .filter((term) => term.length > 3)
    .slice(0, 10);

  if (!terms.length) {
    return [];
  }

  const quickPostIntent = /\b(quick\s*post|brh\s*notes|catatan|note|notes|quote|kutipan)\b/i.test(query);
  const normalizedQuery = terms.join(" ");
  const phraseCandidates = Array.from(query.matchAll(/\b[\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){1,3}\b/gu))
    .map((match) => match[0].toLowerCase())
    .filter((phrase) => phrase.length > 8);

  const chunks = await prisma.knowledgeChunk.findMany({
    where: {
      locale,
      OR: terms.flatMap((term) => [
        { title: { contains: term, mode: "insensitive" } },
        { content: { contains: term, mode: "insensitive" } },
        { category: { contains: term, mode: "insensitive" } },
      ]),
    },
    take: Math.max(limit * 8, 24),
    orderBy: { indexedAt: "desc" },
  });

  return chunks
    .map((chunk) => {
      const title = normalizeSearchText(chunk.title);
      const category = normalizeSearchText(chunk.category || "");
      const content = normalizeSearchText(chunk.content);
      const compactTitle = compactSearchText(chunk.title);
      const compactQuery = compactSearchText(query);
      const termScore = terms.reduce((score, term) => {
        const inTitle = title.includes(term) ? 4 : 0;
        const inCategory = category.includes(term) ? 3 : 0;
        const inContent = content.includes(term) ? 1 : 0;
        return score + inTitle + inCategory + inContent;
      }, 0);
      const phraseScore = phraseCandidates.some((phrase) => content.includes(phrase) || title.includes(phrase)) ? 8 : 0;
      const quickPostScore = quickPostIntent && chunk.sourceType === "quick_post" ? 10 : 0;
      const directQueryScore = normalizedQuery && content.includes(normalizedQuery) ? 10 : 0;
      const titleQueryScore = compactQuery.length > 12 && compactTitle.includes(compactQuery) ? 18 : 0;

      return mapChunk({
        ...chunk,
        score: termScore + phraseScore + quickPostScore + directQueryScore + titleQueryScore,
      });
    })
    .sort((left, right) => (right.score || 0) - (left.score || 0))
    .slice(0, limit);
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
