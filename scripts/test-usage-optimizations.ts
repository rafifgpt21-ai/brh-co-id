import assert from "node:assert/strict";
import type { Post, Block } from "@prisma/client";
import { localizePost } from "@/lib/i18n/posts";
import { toPostCard, postSearchText, normalizePostSearch } from "@/lib/post-cards";
import { postMutationTags, relatedPostsTag, POST_CONTENT_TAG, RELATED_POSTS_TAG } from "@/lib/content-cache";
import { isUploadThingFileUrl, pdfProxyUrl } from "@/lib/pdf-delivery";

const block = (values: Partial<Block>): Block => ({
  id: "block", type: "text", content: null, contentEn: null, url: null,
  title: null, titleEn: null, caption: null, captionEn: null, ...values,
} as Block);
const post: Post = {
  id: "0123456789abcdef01234567", title: "Renungan Café", titleEn: "Reflections",
  slug: "renungan", slugEn: "reflections", category: "Artikel", status: "Published",
  thumbnail: null, publishedAt: new Date("2026-09-01"), createdAt: new Date("2026-08-01"), updatedAt: new Date("2026-09-01"),
  blocks: [block({ content: `<p>${"Cerita ".repeat(30)}</p>`, contentEn: "<p>Translated words</p>" }),
    block({ type: "image", url: "https://example.com/image.webp", captionEn: "Hidden caption" }),
    block({ content: "<p>Deep search phrase</p>", titleEn: "Section heading" })],
};

// Cards must keep the previous rendered text, localization and image fallback.
for (const locale of ["id", "en"] as const) {
  const old = localizePost(post, locale);
  const text = old.blocks.find((item) => item.type === "text")?.content?.replace(/<[^>]*>?/gm, "") || "";
  const card = toPostCard(post, locale);
  assert.equal(card.title, old.title);
  assert.equal(card.slug, old.slug);
  assert.equal(card.snippet, text.slice(0, 100) + (text.length > 100 ? "..." : ""));
  assert.equal(card.thumbnail, "https://example.com/image.webp");
  assert.equal("blocks" in card, false);
  assert.equal("titleEn" in card, false);
}
const fallback = toPostCard({ ...post, titleEn: null, slugEn: null, blocks: [] }, "en");
assert.equal(fallback.title, post.title);
assert.equal(fallback.slug, post.slug);
assert.equal(fallback.snippet, "");
for (const query of ["  CAFE  ", "translated words", "hidden caption", "deep search phrase", "section heading"]) {
  assert.ok(postSearchText(post).includes(normalizePostSearch(query)), query);
}
assert.ok(!postSearchText(post).includes("<p>"));

// Rename/category edits invalidate both old and new dependencies, not every detail.
const previous = { ...post, slug: "old-slug", slugEn: "old-english", category: "Jurnal" };
const tags = postMutationTags(post, previous);
for (const tag of ["post-slug-old-slug", "post-slug-old-english", "post-slug-renungan", "post-slug-reflections", "post-lists", "post-files", relatedPostsTag("Jurnal"), relatedPostsTag("Artikel")]) assert.ok(tags.includes(tag), tag);
assert.equal(new Set(tags).size, tags.length);
assert.ok(!tags.includes(POST_CONTENT_TAG));
assert.ok(!tags.includes(RELATED_POSTS_TAG));
assert.equal(relatedPostsTag("Jurnal"), relatedPostsTag("Publikasi Ilmiah"));

// Never allow arbitrary hosts, local addresses, credentials or non-HTTPS delivery.
for (const url of ["https://m0mix0w8bt.ufs.sh/f/test", "https://utfs.io/f/test"]) assert.ok(isUploadThingFileUrl(url));
for (const url of ["http://utfs.io/f/test", "https://ufs.sh.evil.test/f/test", "https://evilufs.sh/f/test", "https://user:password@utfs.io/f/test", "https://utfs.io:8080/f/test", "http://127.0.0.1", "invalid"]) assert.equal(isUploadThingFileUrl(url), false, url);
const url = "https://utfs.io/f/test?x=1&y=2";
assert.equal(new URL(pdfProxyUrl(url), "https://example.com").searchParams.get("url"), url);
console.log("Usage optimization tests passed: card parity, bilingual search, targeted invalidation, PDF URL validation.");
