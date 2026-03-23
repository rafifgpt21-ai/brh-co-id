import { getPosts } from "@/lib/actions/post";
import KatalogClient from "@/components/katalog/KatalogClient";

export const metadata = {
  title: "Katalog Karya | BRH Intellectual",
  description: "Telusuri kumpulan pemikiran, riset, dan opini terbaik di BRH Intellectual.",
};

import { Suspense } from "react";

export default async function KaryaPage() {
  const posts = await getPosts({ status: 'Published' });

  return (
    <main className="min-h-screen pt-12">
      <Suspense fallback={<div>Loading Katalog...</div>}>
        <KatalogClient initialPosts={posts} />
      </Suspense>
    </main>
  );
}
