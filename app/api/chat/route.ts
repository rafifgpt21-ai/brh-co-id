import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateGroundedAnswer } from "@/lib/ai/gemini";
import { retrieveKnowledge } from "@/lib/chatbot/retrieval";
import { checkRateLimit } from "@/lib/rate-limit";
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

function getClientIdentifier(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return `chat:${forwardedFor || realIp || "unknown"}`;
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format request tidak valid." },
        { status: 400 }
      );
    }

    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Pertanyaan minimal 3 karakter dan maksimal 1000 karakter." },
        { status: 400 }
      );
    }

    const limit = Number(process.env.CHAT_RATE_LIMIT_MAX_REQUESTS || 5);
    const windowMs = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 60_000);
    const rateLimit = await checkRateLimit(getClientIdentifier(request), limit, windowMs);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Terlalu banyak pertanyaan. Coba lagi beberapa saat.",
          resetTime: rateLimit.resetTime?.toISOString(),
        },
        { status: 429 }
      );
    }

    const history = parsed.data.history || [];
    const locale = hasLocale(parsed.data.locale) ? parsed.data.locale : defaultLocale;
    const retrievalQuery = [
      parsed.data.currentPath ? `Halaman saat ini: ${parsed.data.currentPath}` : null,
      ...history.slice(-4).map((message) => message.content),
      parsed.data.message,
    ].filter(Boolean).join("\n");

    const { chunks, context, sources } = await retrieveKnowledge(retrievalQuery, 6, locale);

    if (!chunks.length) {
      return NextResponse.json({
        answer: "Maaf, informasi tersebut belum tersedia di website BRH. Silakan coba pertanyaan lain yang berkaitan dengan artikel, biografi, atau riset BRH.",
        sources: [],
      });
    }

    const answer = await generateGroundedAnswer({
      question: parsed.data.message,
      context,
      history,
    });

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Terjadi gangguan saat memproses chat. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
