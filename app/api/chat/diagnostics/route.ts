import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const started = Date.now();
  try {
    const [knowledgeTotal, knowledgeId, knowledgeEn, knowledgeQuickPosts, publishedPosts, publishedQuickPosts] = await Promise.all([
      prisma.knowledgeChunk.count(),
      prisma.knowledgeChunk.count({ where: { locale: "id" } }),
      prisma.knowledgeChunk.count({ where: { locale: "en" } }),
      prisma.knowledgeChunk.count({ where: { sourceType: "quick_post" } }),
      prisma.post.count({ where: { status: "Published" } }),
      prisma.quickPost.count({ where: { status: "Published" } }),
    ]);
    return NextResponse.json({
      ok: true, service: "chat", checkedAt: new Date().toISOString(), durationMs: Date.now() - started,
      database: { connected: true, publishedPosts, publishedQuickPosts, knowledgeTotal, knowledgeByLocale: { id: knowledgeId, en: knowledgeEn }, knowledgeBySourceType: { quickPost: knowledgeQuickPosts } },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ ok: false, database: { connected: false } }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
