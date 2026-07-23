import { getPublishedPosts } from "@/lib/data/public-content";
import KatalogClient from "@/components/katalog/KatalogClient";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizePost } from "@/lib/i18n/posts";
import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

import { Suspense } from "react";

import KatalogSkeleton from "@/components/katalog/KatalogSkeleton";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) return { title: "Explore | BRH Insight" };

  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);

  return createPageMetadata({
    title:
      lang === "id"
        ? "Karya Budi Rahman Hakim | BRH"
        : "Works by Budi Rahman Hakim | BRH",
    description: dict.explore.metadataDescription,
    path: `/${lang}/explore`,
    locale: lang,
    absoluteTitle: true,
  });
}

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      params: { lang: "en" },
      searchParams: { search: null, category: null },
      headers: [["x-forwarded-proto", null], ["x-forwarded-host", null], ["host", null]],
      cookies: [],
    },
    {
      params: { lang: "id" },
      searchParams: { search: null, category: null },
      headers: [["x-forwarded-proto", null], ["x-forwarded-host", null], ["host", null]],
      cookies: [],
    },
    {
      params: { lang: "en" },
      searchParams: { search: "tasawuf", category: null },
      headers: [["x-forwarded-proto", null], ["x-forwarded-host", null], ["host", null]],
      cookies: [],
    },
  ],
};

async function ExploreResults({
  lang,
  dict,
  searchParams,
}: {
  lang: Locale;
  dict: Awaited<ReturnType<typeof getDictionary>>;
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const { search, category } = await searchParams;
  const posts = await getPublishedPosts({
    search: search || undefined,
    category: category && category !== "Semua" ? category : undefined,
  });
  const localizedPosts = posts.map((post) => localizePost(post, lang));

  return (
    <KatalogClient
      key={`${search || ""}-${category || ""}`}
      initialPosts={localizedPosts}
      lang={lang}
      dict={dict}
    />
  );
}

export default async function KaryaPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);

  return (
    <main className="min-h-screen pt-0 md:pt-12">
      <Suspense fallback={<KatalogSkeleton />}>
        <ExploreResults lang={lang} dict={dict} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
