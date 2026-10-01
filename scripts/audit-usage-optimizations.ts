import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { encode } from "@auth/core/jwt";
import { localizePost } from "@/lib/i18n/posts";
import { toPostCard, postSearchText, normalizePostSearch } from "@/lib/post-cards";
import { LEARNING_MEDIA_CATEGORY } from "@/lib/post-categories";
import { pdfProxyUrl, isUploadThingFileUrl } from "@/lib/pdf-delivery";

async function main() {
  loadEnvConfig(process.cwd(), false);
  const prisma = new PrismaClient();
  const origin = new URL(process.env.USAGE_AUDIT_URL || "http://localhost:3001");
  // This command reads real content but only calls the local test server.
  assert.ok(["localhost", "127.0.0.1"].includes(origin.hostname), "Audit URL must be local");
  try {
    const posts = await prisma.post.findMany({ where: { status: "Published", category: { not: LEARNING_MEDIA_CATEGORY } }, orderBy: { createdAt: "desc" } });
    for (const locale of ["id", "en"] as const) {
      const previous = posts.map((post) => localizePost(post, locale));
      const cards = posts.map((post) => toPostCard(post, locale));
      for (let index = 0; index < posts.length; index++) {
        const text = previous[index].blocks.find((block) => block.type === "text")?.content?.replace(/<[^>]*>?/gm, "") || "";
        assert.equal(cards[index].snippet, text.slice(0, 100) + (text.length > 100 ? "..." : ""));
        assert.equal(cards[index].title, previous[index].title);
        assert.equal(cards[index].slug, previous[index].slug);
      }
      const before = Buffer.byteLength(JSON.stringify(previous));
      const after = Buffer.byteLength(JSON.stringify(cards));
      console.log(JSON.stringify({ locale, posts: posts.length, cardJSONBeforeBytes: before, cardJSONAfterBytes: after, reductionPercent: Number((100 * (1 - after / before)).toFixed(1)) }));
    }
    for (const query of ["tasawuf", "café", "rps", "Islam", "social", "semester"]) {
      const oldSearch = posts.filter((post) => normalizePostSearch([post.title, post.titleEn, post.category, ...post.blocks.flatMap((block) => [(block.content || "").replace(/<[^>]*>/g, " "), (block.contentEn || "").replace(/<[^>]*>/g, " "), block.title, block.titleEn, block.caption, block.captionEn])].filter(Boolean).join(" ")).includes(normalizePostSearch(query))).map((post) => post.id);
      const newSearch = posts.filter((post) => postSearchText(post).includes(normalizePostSearch(query))).map((post) => post.id);
      assert.deepEqual(newSearch, oldSearch, `Search parity: ${query}`);
    }
    for (const path of ["/api/revalidate", "/api/chat/diagnostics"]) {
      const response = await fetch(new URL(path, origin), { method: path.endsWith("revalidate") ? "POST" : "GET", redirect: "manual" });
      assert.equal(response.status, 401, path);
      assert.ok(response.headers.get("cache-control")?.includes("no-store"));
    }
    // Exercise private route guards using temporary local-only JWT fixtures.
    // Tokens and secrets are never printed or sent to the production origin.
    if (process.env.AUTH_SECRET) {
      for (const role of ["USER", "ADMIN"] as const) {
        const name = "authjs.session-token";
        const token: string = await encode({ token: { sub: "local-audit", name: "Local audit", role }, secret: process.env.AUTH_SECRET, salt: name, maxAge: 60 });
        const headers = { Cookie: `${name}=${token}` };
        const session = await fetch(new URL("/api/auth/session", origin), { headers });
        assert.equal((await session.json()).user?.role, role);
        const diagnostics = await fetch(new URL("/api/chat/diagnostics", origin), { headers });
        assert.equal(diagnostics.status, role === "ADMIN" ? 200 : 401);
        assert.ok(diagnostics.headers.get("cache-control")?.includes("no-store"));
      }
      console.log("Local session fixtures: USER denied and ADMIN diagnostics allowed.");
    }
    const health = await fetch(new URL("/api/chat", origin));
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true, service: "chat" });
    const forbidden = await fetch(new URL(pdfProxyUrl("http://127.0.0.1/private"), origin));
    assert.equal(forbidden.status, 403);
    const missing = await fetch(new URL("/api/proxy-pdf", origin));
    assert.equal(missing.status, 400);

    const pdf = posts.flatMap((post) => post.blocks).find((block) => block.type === "pdf" && block.url && isUploadThingFileUrl(block.url));
    if (pdf?.url) {
      const response = await fetch(new URL(pdfProxyUrl(pdf.url), origin), { headers: { Range: "bytes=0-1023" } });
      assert.equal(response.status, 206);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.length, 1024);
      assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
      assert.ok(response.headers.get("cache-control")?.includes("private, no-store"));
      const head = await fetch(new URL(pdfProxyUrl(pdf.url), origin), { method: "HEAD" });
      assert.equal(head.status, 200);
      assert.equal((await head.arrayBuffer()).byteLength, 0);
      console.log("Published PDF fallback: Range 206/1024 bytes and HEAD passed.");
    }
    const draft = await prisma.post.findFirst({ where: { status: "Draft", blocks: { some: { type: "pdf" } } }, select: { blocks: true } });
    const draftUrl = draft?.blocks.find((block) => block.type === "pdf" && block.url && isUploadThingFileUrl(block.url))?.url;
    if (draftUrl) {
      const response = await fetch(new URL(pdfProxyUrl(draftUrl), origin));
      assert.equal(response.status, 403);
      console.log("Draft PDF anonymous access denied.");
    } else console.log("Draft PDF access: no existing fixture; no content created.");
    console.log("Read-only audit passed: real card/search parity, private endpoint guards, health and PDF fallback.");
  } finally { await prisma.$disconnect(); }
}
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Audit failed");
  process.exitCode = 1;
});
