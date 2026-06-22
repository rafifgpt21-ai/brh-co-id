import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateGroundedAnswer } from "@/lib/ai/gemini";
import { retrieveKnowledge } from "@/lib/chatbot/retrieval";
import { checkRateLimit } from "@/lib/rate-limit";
import { defaultLocale, hasLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";

const chatRequestSchema = z.object({
  message: z.string().trim().min(3).max(1000),
  locale: z.string().optional(),
  currentPath: z.string().trim().max(500).optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(1500),
  })).max(8).optional(),
});

function getClientIdentifier(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  const vercelIp = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent")?.slice(0, 80);
  return `chat:${forwardedFor || realIp || cloudflareIp || vercelIp || `ua:${userAgent || "unknown"}`}`;
}

function getErrorInfo(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      status: "status" in error ? (error as { status?: unknown }).status : undefined,
      code: "code" in error ? (error as { code?: unknown }).code : undefined,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
}

function getChatEnvStatus() {
  return {
    databaseUrl: Boolean(process.env.DATABASE_URL),
    geminiApiKey: Boolean(process.env.GEMINI_API_KEY),
    geminiLlmModel: process.env.GEMINI_LLM_MODEL || "gemini-2.5-flash",
    geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
    rateLimitWindowMs: Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 60_000),
    rateLimitMaxRequests: Number(process.env.CHAT_RATE_LIMIT_MAX_REQUESTS || 5),
    vectorIndexName: process.env.CHAT_VECTOR_INDEX_NAME || "knowledge_embedding_vector_index",
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || null,
    vercelRegion: process.env.VERCEL_REGION || null,
  };
}

export async function GET() {
  const startedAt = Date.now();

  try {
    const [knowledgeTotal, knowledgeId, knowledgeEn, publishedPosts] = await Promise.all([
      prisma.knowledgeChunk.count(),
      prisma.knowledgeChunk.count({ where: { locale: "id" } }),
      prisma.knowledgeChunk.count({ where: { locale: "en" } }),
      prisma.post.count({ where: { status: "Published" } }),
    ]);

    return NextResponse.json({
      ok: true,
      service: "chat",
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      env: getChatEnvStatus(),
      database: {
        connected: true,
        publishedPosts,
        knowledgeTotal,
        knowledgeByLocale: {
          id: knowledgeId,
          en: knowledgeEn,
        },
      },
      notes: [
        "This endpoint does not expose secret values.",
        "If knowledgeTotal is 0, run npm run index:chatbot against the production DATABASE_URL.",
        "If POST /api/chat fails but this endpoint is ok, check Gemini quota/model logs.",
      ],
    });
  } catch (error) {
    const errorInfo = getErrorInfo(error);
    console.error("Chat health check failed:", errorInfo);

    return NextResponse.json(
      {
        ok: false,
        service: "chat",
        checkedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        env: getChatEnvStatus(),
        database: {
          connected: false,
        },
        error: {
          name: errorInfo.name,
          message: errorInfo.message,
          status: errorInfo.status,
          code: errorInfo.code,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  let stage = "start";

  try {
    let body: unknown;
    try {
      stage = "parse_json";
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format request tidak valid.", code: "INVALID_JSON", requestId },
        { status: 400, headers: { "x-chat-request-id": requestId } }
      );
    }

    stage = "validate_input";
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Pertanyaan minimal 3 karakter dan maksimal 1000 karakter.", code: "INVALID_INPUT", requestId },
        { status: 400, headers: { "x-chat-request-id": requestId } }
      );
    }

    const limit = Number(process.env.CHAT_RATE_LIMIT_MAX_REQUESTS || 5);
    const windowMs = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 60_000);
    const identifier = getClientIdentifier(request);

    stage = "rate_limit";
    const rateLimit = await checkRateLimit(identifier, limit, windowMs);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Terlalu banyak pertanyaan. Coba lagi beberapa saat.",
          code: "RATE_LIMITED",
          requestId,
          resetTime: rateLimit.resetTime?.toISOString(),
        },
        { status: 429, headers: { "x-chat-request-id": requestId } }
      );
    }

    const history = parsed.data.history || [];
    const locale = hasLocale(parsed.data.locale) ? parsed.data.locale : defaultLocale;
    const retrievalQuery = [
      parsed.data.currentPath ? `Halaman saat ini: ${parsed.data.currentPath}` : null,
      ...history.slice(-4).map((message) => message.content),
      parsed.data.message,
    ].filter(Boolean).join("\n");

    stage = "retrieve_knowledge";
    const { chunks, context, sources } = await retrieveKnowledge(retrievalQuery, 6, locale);

    if (!chunks.length) {
      return NextResponse.json({
        answer: "Maaf, informasi tersebut belum tersedia di website BRH. Silakan coba pertanyaan lain yang berkaitan dengan artikel, biografi, atau riset BRH.",
        sources: [],
        requestId,
      }, { headers: { "x-chat-request-id": requestId } });
    }

    stage = "generate_answer";
    const answer = await generateGroundedAnswer({
      question: parsed.data.message,
      context,
      history,
    });

    console.info("Chat API success:", {
      requestId,
      locale,
      sources: sources.length,
      chunks: chunks.length,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      { answer, sources, requestId },
      { headers: { "x-chat-request-id": requestId } }
    );
  } catch (error) {
    const errorInfo = getErrorInfo(error);
    console.error("Chat API error:", {
      requestId,
      stage,
      ...errorInfo,
    });

    return NextResponse.json(
      {
        error: "Terjadi gangguan saat memproses chat. Silakan coba lagi.",
        code: "CHAT_INTERNAL_ERROR",
        requestId,
        stage,
      },
      { status: 500, headers: { "x-chat-request-id": requestId } }
    );
  }
}
