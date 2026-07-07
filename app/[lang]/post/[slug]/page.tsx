import { getPublishedPostBySlug, getRelatedPublishedPosts } from "@/lib/data/public-content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PostClient from "@/components/post/PostClient";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizePost } from "@/lib/i18n/posts";
import { buildAbsoluteUrl } from "@/lib/share-url";
import { Suspense } from "react";
import { RouteSkeleton } from "@/components/ui/RouteSkeleton";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      params: {
        lang: "en",
        slug: "esensi-analisis-kebijakan-dalam-tatanan-global-93-j9pqv",
      },
      headers: [["x-forwarded-proto", null], ["x-forwarded-host", null], ["host", null]],
      cookies: [],
    },
    {
      params: {
        lang: "id",
        slug: "esensi-analisis-kebijakan-dalam-tatanan-global-93-j9pqv",
      },
      headers: [["x-forwarded-proto", null], ["x-forwarded-host", null], ["host", null]],
      cookies: [],
    },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  if (!hasLocale(rawLang)) return { title: "Post Not Found" };
  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return { title: dict.post.notFound };
  }
  const localizedPost = localizePost(post, lang);
  const firstTextBlock = localizedPost.blocks.find((block) => block.type === 'text');
  const description = firstTextBlock?.content?.replace(/<[^>]*>/g, '').slice(0, 160) || `${dict.home.readMore} ${localizedPost.title}`;
  const canonicalUrl = buildAbsoluteUrl(`/${lang}/post/${localizedPost.slug}`);

  return {
    title: `${localizedPost.title} | BRH Intellectual Platform`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: localizedPost.title,
      description,
      url: canonicalUrl,
      siteName: "BRH Intellectual Platform",
      type: "article",
      publishedTime: new Date(post.createdAt).toISOString(),
      images: post.thumbnail ? [{ url: post.thumbnail, alt: localizedPost.title }] : [],
    },
  };
}

async function SinglePostContent({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: rawLang, slug } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }
  const localizedPost = localizePost(post, lang);

  const relatedPosts = (await getRelatedPublishedPosts({
    category: post.category,
    excludeId: post.id,
    limit: 3,
  })).map((item) => localizePost(item, lang));

  return <PostClient post={localizedPost} relatedPosts={relatedPosts} lang={lang} dict={dict} />;
}

export default function SinglePostPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  return (
    <Suspense fallback={<RouteSkeleton variant="article" />}>
      <SinglePostContent params={params} />
    </Suspense>
  );
}
