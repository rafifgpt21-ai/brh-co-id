import { getPosts } from "@/lib/actions/post";
import KatalogClient from "@/components/katalog/KatalogClient";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizePost } from "@/lib/i18n/posts";
import { notFound } from "next/navigation";

import { Suspense } from "react";

import KatalogSkeleton from "@/components/katalog/KatalogSkeleton";

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
  const { search, category } = await searchParams;
  const posts = await getPosts({
    status: 'Published',
    locale: lang,
    search: search || undefined,
    category: category && category !== 'Semua' ? category : undefined
  });
  const localizedPosts = posts.map((post: any) => localizePost(post, lang));

  return (
    <main className="min-h-screen pt-0 md:pt-12">
      <Suspense fallback={<KatalogSkeleton />}>
        <KatalogClient initialPosts={localizedPosts} lang={lang} dict={dict} />
      </Suspense>
    </main>
  );
}
