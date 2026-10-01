import { getPostByFileUrl } from "@/lib/actions/post";
import { isUploadThingFileUrl } from "@/lib/pdf-delivery";
import { NextRequest, NextResponse } from "next/server";

async function servePdf(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing URL parameter", { status: 400 });
  if (!isUploadThingFileUrl(url)) return new NextResponse("Unauthorized URL", { status: 403 });

  try {
    const access = await getPostByFileUrl(url);
    if (!access.authorized) return new NextResponse("Forbidden", { status: 403, headers: { "Cache-Control": "private, no-store" } });
    const headers = new Headers();
    for (const name of ["range", "if-range", "if-none-match", "if-modified-since"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const response = await fetch(url, {
      method: request.method === "HEAD" ? "HEAD" : "GET",
      headers,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]),
    });
    const output = new Headers({
      "Content-Type": response.headers.get("content-type") || "application/pdf",
      "X-Content-Type-Options": "nosniff",
      // Access may change when a post is unpublished. Always recheck it for
      // fallback requests; public PDFs use storage delivery and its own cache.
      "Cache-Control": "private, no-store",
    });
    for (const name of ["content-range", "accept-ranges", "etag", "last-modified"]) {
      const value = response.headers.get(name);
      if (value) output.set(name, value);
    }
    // Fetch may decompress the upstream body; do not forward an encoded length.
    if (!response.headers.get("content-encoding")) {
      const length = response.headers.get("content-length");
      if (length) output.set("content-length", length);
    }
    return new Response(request.method === "HEAD" || response.status === 304 ? null : response.body, {
      status: response.status,
      headers: output,
    });
  } catch (error) {
    console.error("PDF proxy failed", error);
    return new NextResponse("Unable to fetch PDF", { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export const GET = servePdf;
export const HEAD = servePdf;
