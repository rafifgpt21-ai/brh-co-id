import { auth } from "@/auth";
import { QuickPostFeed } from "@/components/home/QuickPostFeed";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import { getQuickPostsByType } from "@/lib/actions/quick-post";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { buildAbsoluteUrl } from "@/lib/share-url";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      params: { lang: "en" },
      headers: [["x-forwarded-proto", null], ["x-forwarded-host", null], ["host", null]],
      cookies: [],
    },
    {
      params: { lang: "id" },
      headers: [["x-forwarded-proto", null], ["x-forwarded-host", null], ["host", null]],
      cookies: [],
    },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) return { title: "Notes Not Found" };

  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);
  const canonicalUrl = buildAbsoluteUrl(`/${lang}/catatan`);

  return {
    title: `${dict.quickPost.allTitle} | BRH Insight`,
    description: dict.quickPost.allIntro,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: dict.quickPost.allTitle,
      description: dict.quickPost.allIntro,
      url: canonicalUrl,
      siteName: "BRH Insight",
      type: "website",
    },
  };
}

function getQuickPostFeedLabels(dict: Awaited<ReturnType<typeof getDictionary>>) {
  return {
    addImage: dict.quickPost.addImage,
    changeImage: dict.quickPost.changeImage,
    removeImage: dict.quickPost.removeImage,
    sourceArticle: dict.quickPost.sourceArticle,
    readSource: dict.quickPost.readSource,
    emptyDescription: dict.quickPost.emptyDescription,
    agendaRequired: dict.quickPost.agendaRequired,
    normal: dict.quickPost.normal,
    agenda: dict.quickPost.agenda,
    quote: dict.quickPost.quote,
    emptyNormal: dict.quickPost.emptyNormal,
    emptyAgenda: dict.quickPost.emptyAgenda,
    emptyQuote: dict.quickPost.emptyQuote,
    readMore: dict.quickPost.readMore,
    showLess: dict.quickPost.showLess,
    viewAll: dict.quickPost.viewAll,
    viewAllNormal: dict.quickPost.viewAllNormal,
    viewAllAgenda: dict.quickPost.viewAllAgenda,
    viewAllQuote: dict.quickPost.viewAllQuote,
    draftBadge: dict.quickPost.draftBadge,
    completedBadge: dict.quickPost.completedBadge,
    publish: dict.quickPost.publish,
    edit: dict.quickPost.edit,
    save: dict.quickPost.save,
    cancel: dict.quickPost.cancel,
    delete: dict.quickPost.delete,
    share: dict.quickPost.share,
    shareToFacebook: dict.quickPost.shareToFacebook,
    shareToWhatsapp: dict.quickPost.shareToWhatsapp,
    copyLink: dict.quickPost.copyLink,
    linkCopied: dict.quickPost.linkCopied,
    agendaDate: dict.quickPost.agendaDate,
    agendaStartTime: dict.quickPost.agendaStartTime,
    agendaEndTime: dict.quickPost.agendaEndTime,
    agendaTimeZone: dict.quickPost.agendaTimeZone,
    agendaLocation: dict.quickPost.agendaLocation,
    agendaLocationPlaceholder: dict.quickPost.agendaLocationPlaceholder,
    addressSearching: dict.quickPost.addressSearching,
    addressNoResults: dict.quickPost.addressNoResults,
    addressSearchError: dict.quickPost.addressSearchError,
    addressPoweredBy: dict.quickPost.addressPoweredBy,
  };
}

async function CatatanFeed({ dict, lang }: { dict: Awaited<ReturnType<typeof getDictionary>>; lang: Locale }) {
  await connection();

  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const quickPosts = await getQuickPostsByType({ includeDrafts: isAdmin, limitPerType: 60 });

  return (
    <QuickPostFeed
      quickPosts={quickPosts}
      isAdmin={isAdmin}
      lang={lang}
      labels={getQuickPostFeedLabels(dict)}
      variant="full"
    />
  );
}

function CatatanFeedFallback() {
  return (
    <section id="notes" className="grid grid-cols-1 gap-6 lg:grid-cols-3" aria-label="Loading notes">
      <div className="min-h-80 animate-pulse rounded-[1.75rem] border border-outline-variant/25 bg-surface-container-low" />
      <div className="hidden min-h-80 animate-pulse rounded-[1.75rem] border border-outline-variant/25 bg-surface-container-low lg:block" />
      <div className="hidden min-h-80 animate-pulse rounded-[1.75rem] border border-outline-variant/25 bg-surface-container-low lg:block" />
    </section>
  );
}

export default async function CatatanPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();

  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);

  return (
    <main className="min-h-screen bg-surface px-4 pb-24 pt-8 sm:px-6 sm:pt-12 md:px-12 lg:px-24 lg:pt-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-outline-variant/30 pb-6 sm:mb-10 sm:pb-8">
          <OptimisticLink
            href={`/${lang}`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-4 text-[11px] font-black uppercase tracking-wider text-on-surface-variant transition hover:border-secondary/40 hover:bg-secondary/10 hover:text-secondary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[17px]">west</span>
            {dict.quickPost.backHome}
          </OptimisticLink>

          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.45fr)] lg:items-end">
            <div>
              <span className="font-label text-[10px] font-black uppercase tracking-[0.28em] text-secondary sm:text-xs">
                {dict.quickPost.eyebrow}
              </span>
              <h1 className="mt-3 max-w-3xl font-headline text-4xl font-black leading-tight tracking-tight text-primary sm:text-5xl md:text-6xl">
                {dict.quickPost.allTitle}
              </h1>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant/72 sm:text-base lg:justify-self-end">
              {dict.quickPost.allIntro}
            </p>
          </div>
        </header>

        <Suspense fallback={<CatatanFeedFallback />}>
          <CatatanFeed dict={dict} lang={lang} />
        </Suspense>
      </div>
    </main>
  );
}
