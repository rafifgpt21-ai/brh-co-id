import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const addressSearchSchema = z.object({
  q: z.string().trim().min(3).max(120),
  lang: z.enum(["id", "en"]).default("id"),
});

type GeoapifyResult = {
  formatted?: string;
  lat?: number;
  lon?: number;
};

type GeoapifyResponse = {
  results?: GeoapifyResult[];
};

export async function GET(request: NextRequest) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedQuery = addressSearchSchema.safeParse({
    q: request.nextUrl.searchParams.get("q") || "",
    lang: request.nextUrl.searchParams.get("lang") || "id",
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Query alamat tidak valid" }, { status: 400 });
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Pencarian alamat belum dikonfigurasi" }, { status: 503 });
  }

  const params = new URLSearchParams({
    text: parsedQuery.data.q,
    lang: parsedQuery.data.lang,
    limit: "5",
    format: "json",
    bias: "countrycode:id",
    apiKey,
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("Geoapify address search failed:", response.status, response.statusText);
      return NextResponse.json({ error: "Layanan pencarian alamat tidak tersedia" }, { status: 502 });
    }

    const payload = await response.json() as GeoapifyResponse;
    const seen = new Set<string>();
    const results = (payload.results || []).flatMap((result) => {
      if (!result.formatted || typeof result.lat !== "number" || typeof result.lon !== "number") {
        return [];
      }

      const key = `${result.formatted}:${result.lat}:${result.lon}`;
      if (seen.has(key)) return [];
      seen.add(key);

      return [{
        label: result.formatted,
        latitude: result.lat,
        longitude: result.lon,
      }];
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Address search error:", error);
    return NextResponse.json({ error: "Gagal mencari alamat" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
