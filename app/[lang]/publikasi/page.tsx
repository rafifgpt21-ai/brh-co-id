import { notFound } from "next/navigation";
import PublicationClient, {
  type PublicationBookPost,
} from "@/components/publication/PublicationClient";
import { getPublishedPosts } from "@/lib/data/public-content";
import { hasLocale } from "@/lib/i18n/config";

function stripHtml(value: string | null | undefined) {
  const plainText = (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  return plainText.length > 360 ? `${plainText.slice(0, 357).trimEnd()}...` : plainText;
}

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      params: { lang: "id" },
      headers: [["x-forwarded-proto", null], ["x-forwarded-host", null], ["host", null]],
      cookies: [],
    },
    {
      params: { lang: "en" },
      headers: [["x-forwarded-proto", null], ["x-forwarded-host", null], ["host", null]],
      cookies: [],
    },
  ],
};

export default async function PublikasiPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const posts = await getPublishedPosts({ category: "Buku" });
  const books: PublicationBookPost[] = posts.map((post) => {
    const firstTextBlock = post.blocks.find((block) => block.type === "text");

    return {
      id: post.id,
      title: post.title,
      titleEn: post.titleEn,
      slug: post.slug,
      slugEn: post.slugEn,
      thumbnail: post.thumbnail,
      publishedAt: (post.publishedAt || post.createdAt).toISOString(),
      summary: stripHtml(firstTextBlock?.content),
      summaryEn: stripHtml(firstTextBlock?.contentEn),
    };
  });

  return <PublicationClient books={books} initialLanguage={lang} />;
}
