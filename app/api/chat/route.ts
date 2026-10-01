import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateGroundedAnswer } from "@/lib/ai/gemini";
import { defaultLocale, hasLocale } from "@/lib/i18n/config";

const chatRequestSchema = z.object({
  message: z.string().trim().min(3).max(1000),
  locale: z.string().optional(),
  currentPath: z.string().trim().max(500).optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(1500),
  })).max(8).optional(),
});

const REFERENCE_INTENT_PATTERNS = [
  /\blink\b/i,
  /\blink(nya)?\b/i,
  /\btautan(nya)?\b/i,
  /\breferensi(nya)?\b/i,
  /\breverensi(nya)?\b/i,
  /\bsumber(nya)?\b/i,
  /\bsource(s)?\b/i,
  /\bcitation(s)?\b/i,
  /\bartikel terkait\b/i,
  /\bbaca selengkapnya\b/i,
  /\brujukan(nya)?\b/i,
  /\blampirkan\b/i,
  /\bkasih\b.*\b(referensi|reverensi|link|tautan|sumber)\b/i,
  /\bberikan\b.*\b(referensi|reverensi|link|tautan|sumber)\b/i,
  /\btampilkan\b.*\b(referensi|reverensi|link|tautan|sumber|artikel)\b/i,
];

function normalizeIntentText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function wantsReferenceCards(message: string, history: Array<{ role: "user" | "assistant"; content: string }>) {
  const latest = normalizeIntentText(message);

  if (REFERENCE_INTENT_PATTERNS.some((pattern) => pattern.test(latest))) {
    return true;
  }

  const recentUserAskedForReferences = history
    .slice(-4)
    .filter((item) => item.role === "user")
    .some((item) => REFERENCE_INTENT_PATTERNS.some((pattern) => pattern.test(normalizeIntentText(item.content))));
  const looksLikeContextualFollowUp = latest.length <= 60 && /\b(itu|tadi|yang tadi|nya)\b/i.test(latest);

  return recentUserAskedForReferences && looksLikeContextualFollowUp;
}

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

export async function GET() {
  // Liveness needs no database queries. Diagnostics have a private endpoint.
  return NextResponse.json({ ok: true, service: "chat" });
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
    const { checkRateLimit } = await import("@/lib/rate-limit");
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
    const includeReferences = wantsReferenceCards(parsed.data.message, history);
    const retrievalQuery = [
      parsed.data.currentPath ? `Halaman saat ini: ${parsed.data.currentPath}` : null,
      ...history.slice(-4).map((message) => message.content),
      parsed.data.message,
    ].filter(Boolean).join("\n");

    stage = "retrieve_knowledge";
    const { retrieveKnowledge } = await import("@/lib/chatbot/retrieval");
    const { chunks, context, sources } = await retrieveKnowledge(retrievalQuery, 6, locale);

    if (!chunks.length) {
      return NextResponse.json({
        answer: locale === "id"
          ? "Maaf, informasi tersebut belum tersedia di arsip BRH. Silakan coba pertanyaan lain yang berkaitan dengan artikel, biografi, publikasi, atau riset BRH."
          : "Sorry, that information is not available in the BRH archive yet. Try another question related to BRH articles, biography, publications, or research.",
        sources: [],
        requestId,
      }, { headers: { "x-chat-request-id": requestId } });
    }

    stage = "generate_answer";
    const answer = await generateGroundedAnswer({
      question: parsed.data.message,
      context,
      includeReferences,
      history,
    });

    console.info("Chat API success:", {
      requestId,
      locale,
      sources: includeReferences ? sources.length : 0,
      retrievedSources: sources.length,
      chunks: chunks.length,
      includeReferences,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      { answer, sources: includeReferences ? sources : [], requestId },
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
