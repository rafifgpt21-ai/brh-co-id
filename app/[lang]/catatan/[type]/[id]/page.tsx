import { ShareActions } from "@/components/common/ShareActions";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import { RouteSkeleton } from "@/components/ui/RouteSkeleton";
import { getPublishedQuoteById } from "@/lib/data/public-content";
import { formatLocalizedDate, hasLocale, withLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildAbsoluteUrl, getSocialPreviewVersion } from "@/lib/share-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type QuotePageParams = Promise<{ lang: string; type: string; id: string }>;

function cleanQuote(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit).trim()}…` : value;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: QuotePageParams;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { lang: rawLang, type, id } = await params;
  if (!hasLocale(rawLang) || type !== "kutipan") return { title: "Quote Not Found" };

  const lang: Locale = rawLang;
  const quote = await getPublishedQuoteById(id);
  if (!quote) return { title: lang === "id" ? "Kutipan Tidak Ditemukan" : "Quote Not Found" };

  const content = cleanQuote(quote.content);
  const title = truncate(content, 110);
  const description = `“${truncate(content, 190)}” — BRH`;
  const canonicalUrl = buildAbsoluteUrl(withLocale(`/catatan/kutipan/${quote.id}`, lang));
  const idUrl = buildAbsoluteUrl(withLocale(`/catatan/kutipan/${quote.id}`, "id"));
  const enUrl = buildAbsoluteUrl(withLocale(`/catatan/kutipan/${quote.id}`, "en"));
  const version = getSocialPreviewVersion(quote.updatedAt);
  const imageUrl = buildAbsoluteUrl(`${withLocale(`/catatan/kutipan/${quote.id}/opengraph-image`, lang)}?v=${version}`);
  const query = await searchParams;
  const shareTarget = query.share === "facebook" || query.share === "whatsapp" ? query.share : null;

  return {
    title: { absolute: `“${title}” | BRH Insight` },
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: { id: idUrl, en: enUrl, "x-default": idUrl },
    },
    openGraph: {
      title: `“${title}”`,
      description: lang === "id" ? "Kutipan BRH Insight" : "A quote from BRH Insight",
      url: shareTarget ? `${canonicalUrl}?share=${shareTarget}&v=${version}` : canonicalUrl,
      siteName: "BRH Insight",
      type: "article",
      publishedTime: quote.createdAt.toISOString(),
      modifiedTime: quote.updatedAt.toISOString(),
      locale: lang === "id" ? "id_ID" : "en_US",
      images: [{
        url: imageUrl,
        secureUrl: imageUrl,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: description,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: `“${title}”`,
      description,
      images: [{ url: imageUrl, alt: description }],
    },
  };
}

async function QuoteContent({ params }: { params: QuotePageParams }) {
  const { lang: rawLang, type, id } = await params;
  if (!hasLocale(rawLang) || type !== "kutipan") notFound();

  const lang: Locale = rawLang;
  const [dict, quote] = await Promise.all([getDictionary(lang), getPublishedQuoteById(id)]);
  if (!quote) notFound();

  const shareUrl = buildAbsoluteUrl(withLocale(`/catatan/kutipan/${quote.id}`, lang));
  const version = getSocialPreviewVersion(quote.updatedAt);
  const shareTitle = `“${cleanQuote(quote.content)}”\n— BRH`;

  return (
    <main className="relative isolate min-h-[calc(100svh-3.5rem)] overflow-hidden bg-surface px-4 pb-24 pt-8 sm:px-6 sm:pt-12 md:px-12 lg:px-24 lg:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-secondary/8 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-primary/6 blur-3xl" />

      <div className="relative mx-auto w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
          <OptimisticLink
            href={withLocale("/catatan/kutipan", lang)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-lowest/90 px-4 text-[10px] font-black uppercase tracking-wider text-on-surface-variant shadow-sm transition hover:border-secondary/40 hover:bg-secondary/10 hover:text-secondary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[17px]">west</span>
            {dict.quickPost.viewAllQuote}
          </OptimisticLink>
          <span className="hidden font-label text-[10px] font-black uppercase tracking-[0.24em] text-secondary/75 sm:block">
            BRH Insight
          </span>
        </div>

        <article className="relative overflow-visible rounded-[1.75rem] border border-outline-variant/25 bg-surface-container-lowest shadow-[0_34px_90px_-55px_rgba(55,34,28,0.55)] sm:rounded-[2.25rem]">
          <span aria-hidden="true" className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-secondary/70 to-transparent" />
          <div className="border-b border-outline-variant/25 px-6 py-5 sm:px-10 sm:py-6 md:px-14">
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-secondary sm:text-[11px]">
              <span>{dict.home.heroPanel.quoteOfTheDay}</span>
              <span className="h-px min-w-8 flex-1 bg-outline-variant/70" />
              <time className="tracking-normal text-on-surface-variant/55" dateTime={quote.createdAt.toISOString()}>
                {formatLocalizedDate(quote.createdAt, lang)}
              </time>
            </div>
          </div>

          <figure className="relative px-6 py-10 sm:px-10 sm:py-14 md:px-14 md:py-16">
            <span aria-hidden="true" className="material-symbols-outlined absolute right-7 top-5 text-[72px] text-secondary/8 sm:right-12 sm:top-8 sm:text-[96px]">
              format_quote
            </span>
            <blockquote className="relative max-w-4xl text-pretty font-headline text-2xl font-semibold italic leading-[1.45] tracking-[-0.025em] text-tertiary sm:text-3xl md:text-[2.4rem] md:leading-[1.38]">
              “{quote.content}”
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-3 font-label text-xs font-black uppercase tracking-[0.3em] text-secondary sm:mt-10 sm:text-sm">
              <span className="h-px w-8 bg-secondary/45" />
              BRH
            </figcaption>
          </figure>

          <div className="flex flex-col gap-4 border-t border-outline-variant/25 bg-surface-container-low/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10 md:px-14">
            <p className="max-w-md text-xs leading-relaxed text-on-surface-variant/65 sm:text-sm">
              {lang === "id"
                ? "Bagikan kutipan ini sebagai kartu visual yang siap tampil di WhatsApp atau Facebook."
                : "Share this quote as a visual card ready for WhatsApp or Facebook."}
            </p>
            <ShareActions
              url={shareUrl}
              facebookShareUrl={`${shareUrl}?share=facebook&v=${version}`}
              whatsappShareUrl={`${shareUrl}?share=whatsapp&v=${version}`}
              title={shareTitle}
              labels={{
                share: dict.quickPost.share,
                shareToFacebook: dict.quickPost.shareToFacebook,
                shareToWhatsapp: dict.quickPost.shareToWhatsapp,
                copyLink: dict.quickPost.copyLink,
                linkCopied: dict.quickPost.linkCopied,
              }}
              className="shrink-0 sm:justify-end"
            />
          </div>
        </article>
      </div>
    </main>
  );
}

export default function QuotePage({ params }: { params: QuotePageParams }) {
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <QuoteContent params={params} />
    </Suspense>
  );
}
