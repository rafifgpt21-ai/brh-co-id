import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Missing URL parameter", { status: 400 });
  }

  try {
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return new NextResponse(`Failed to fetch PDF: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type");
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType || "application/pdf",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*", // Allow browser to read this via proxy
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
