import { getPosts } from "@/lib/actions/post";
import KatalogClient from "@/components/katalog/KatalogClient";

export const metadata = {
  title: "Explore Karya | BRH Intellectual",
  description: "Telusuri kumpulan pemikiran, riset, dan opini terbaik di BRH Intellectual.",
};

import { Suspense } from "react";

import KatalogSkeleton from "@/components/katalog/KatalogSkeleton";

export default async function KaryaPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const { search, category } = await searchParams;
  const posts = await getPosts({ 
    status: 'Published',
    search: search || undefined,
    category: category && category !== 'Semua' ? category : undefined
  });

  return (
    <main className="min-h-screen pt-12">
      <Suspense key={`${search}-${category}`} fallback={<KatalogSkeleton />}>
        <KatalogClient initialPosts={posts} />
      </Suspense>
    </main>
  );
}
