import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const coverFiles: Record<string, string> = {
  "actualization-of-neo-sufism": "actualization-of-neo-sufism.jpeg",
  "akhlaq-tasawuf": "akhlaq-tasawuf.jpeg",
  "pengantar-ilmu-tasawuf": "pengantar-ilmu-tasawuf.jpeg",
  "resurgensi-islam-sufi": "resurgensi-islam-sufi.jpeg",
  "selayang-pandang-tasawuf-tarekat-sufi": "selayang-pandang-tasawuf-tarekat-sufi.jpeg",
  sufinomic: "sufinomic.jpeg",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const fileName = coverFiles[slug];

  if (!fileName) {
    return new NextResponse("Cover not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "book-cover", fileName);
  const bytes = await readFile(filePath);

  return new NextResponse(bytes, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/jpeg",
    },
  });
}
