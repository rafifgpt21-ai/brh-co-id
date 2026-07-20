import { getPublishedPostBySlug, getRelatedPublishedPosts } from "@/lib/data/public-content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PostClient from "@/components/post/PostClient";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizePost } from "@/lib/i18n/posts";
import { buildAbsoluteUrl, getSocialPreviewVersion } from "@/lib/share-url";
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

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
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
  const updatedAt = new Date(post.updatedAt).toISOString();
  const shareVersion = getSocialPreviewVersion(post.updatedAt);
  const query = await searchParams;
  const shareTarget = query.share === "facebook" || query.share === "whatsapp"
    ? query.share
    : null;
  const openGraphUrl = shareTarget
    ? `${canonicalUrl}?share=${shareTarget}&v=${shareVersion}`
    : canonicalUrl;
  const isWhatsappShare = shareTarget === "whatsapp" && Boolean(post.thumbnail);
  const socialImageUrl = isWhatsappShare
    ? buildAbsoluteUrl(`/api/share-image/${encodeURIComponent(localizedPost.slug)}.jpg?v=${shareVersion}`)
    : buildAbsoluteUrl(`/${lang}/post/${localizedPost.slug}/opengraph-image?v=${shareVersion}`);
  const socialImage = {
    url: socialImageUrl,
    secureUrl: socialImageUrl,
    width: isWhatsappShare ? 600 : 1200,
    height: isWhatsappShare ? 315 : 630,
    type: isWhatsappShare ? "image/jpeg" : "image/png",
    alt: localizedPost.title,
  };

  return {
    title: `${localizedPost.title} | BRH Insight`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: localizedPost.title,
      description,
      url: openGraphUrl,
      siteName: "BRH Insight",
      type: "article",
      publishedTime: new Date(post.publishedAt || post.createdAt).toISOString(),
      modifiedTime: updatedAt,
      locale: lang === "id" ? "id_ID" : "en_US",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: localizedPost.title,
      description,
      images: [{ url: socialImageUrl, alt: localizedPost.title }],
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
