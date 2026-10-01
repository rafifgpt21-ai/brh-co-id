import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { HOME_FEATURED_TAG, POST_CONTENT_TAG, POST_FILES_TAG, POST_LISTS_TAG, RELATED_POSTS_TAG } from "@/lib/content-cache";

export async function POST(request: Request) {
  const secret = process.env.CONTENT_REVALIDATION_SECRET;
  const supplied = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (!secret || suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  // This endpoint is intentionally bulk-only for trusted import scripts.
  for (const tag of [POST_LISTS_TAG, POST_CONTENT_TAG, POST_FILES_TAG, HOME_FEATURED_TAG, RELATED_POSTS_TAG, "posts", "quick-posts"]) {
    revalidateTag(tag, { expire: 0 });
  }
  return NextResponse.json({ revalidated: true }, { headers: { "Cache-Control": "no-store" } });
}
