import { getPostBySlug, getPosts } from "@/lib/actions/post";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import type { Metadata } from "next";
import PostClient from "@/components/post/PostClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const session = await auth();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  if (!post || (post.status !== "Published" && !isAdmin)) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} | BRH Intellectual Platform`,
    description: post.blocks.find(b => b.type === 'text')?.content?.replace(/<[^>]*>/g, '').slice(0, 160) || `Baca selengkapnya tentang ${post.title}`,
    openGraph: {
      title: post.title,
      description: `Penelitian dan Artikel: ${post.title}`,
      images: post.thumbnail ? [post.thumbnail] : [],
    },
  };
}

export default async function SinglePostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  if (!post || (post.status !== "Published" && !isAdmin)) {
    notFound();
  }

  // Fetch related posts (same category)
  const allPosts = await getPosts({ status: 'Published', category: post.category });
  const relatedPosts = (allPosts as any[]).filter((p: any) => p.id !== post.id).slice(0, 3);

  return <PostClient post={post} relatedPosts={relatedPosts} />;
}
