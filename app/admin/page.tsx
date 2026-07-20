import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getHomeFeaturedPostIdsForAdmin, getPosts } from "@/lib/actions/post";
import { AdminPostList } from "@/components/admin/AdminPostList";
import { Suspense } from "react";
import { getArticleReposts } from "@/lib/actions/quick-post";

function AdminPageFallback() {
  return <div className="min-h-[50vh] animate-pulse rounded-2xl bg-surface-container-low" />;
}

async function AdminDashboardContent() {
  const session = await auth();
  
  if (!session) {
    redirect("/admin/login");
  }

  if (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const [posts, homeFeaturedPostIds, articleReposts] = await Promise.all([
    getPosts(),
    getHomeFeaturedPostIdsForAdmin(),
    getArticleReposts(),
  ]);

  // Serialize dates for the client component
  const serializedPosts = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: p.category,
    status: p.status,
    thumbnail: p.thumbnail,
    excerpt: p.blocks
      .find((block) => block.type === "text")
      ?.content.replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 520) || "",
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  return (
    <AdminPostList
      initialPosts={serializedPosts}
      initialHomeFeaturedPostIds={homeFeaturedPostIds}
      initialArticleReposts={articleReposts}
    />
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<AdminPageFallback />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
