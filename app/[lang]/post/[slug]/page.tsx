import { getPostBySlug, getPosts } from "@/lib/actions/post";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import type { Metadata } from "next";
import PostClient from "@/components/post/PostClient";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizePost } from "@/lib/i18n/posts";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  if (!hasLocale(rawLang)) return { title: "Post Not Found" };
  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);
  const post = await getPostBySlug(slug);
  const session = await auth();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  if (!post || (post.status !== "Published" && !isAdmin)) {
    return { title: dict.post.notFound };
  }
  const localizedPost = localizePost(post as any, lang);
  const firstTextBlock = localizedPost.blocks.find((b: any) => b.type === 'text');

  return {
    title: `${localizedPost.title} | BRH Intellectual Platform`,
    description: firstTextBlock?.content?.replace(/<[^>]*>/g, '').slice(0, 160) || `${dict.home.readMore} ${localizedPost.title}`,
    openGraph: {
      title: localizedPost.title,
      description: `${dict.post.descriptionPrefix} ${localizedPost.title}`,
      images: post.thumbnail ? [post.thumbnail] : [],
    },
  };
}

export default async function SinglePostPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: rawLang, slug } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);
  const post = await getPostBySlug(slug);
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  if (!post || (post.status !== "Published" && !isAdmin)) {
    notFound();
  }
  const localizedPost = localizePost(post as any, lang);

  // Fetch related posts (same category)
  const allPosts = await getPosts({ status: 'Published', category: post.category });
  const relatedPosts = (allPosts as any[])
    .filter((p: any) => p.id !== post.id)
    .slice(0, 3)
    .map((item) => localizePost(item, lang));

  return <PostClient post={localizedPost} relatedPosts={relatedPosts} lang={lang} dict={dict} />;
}
