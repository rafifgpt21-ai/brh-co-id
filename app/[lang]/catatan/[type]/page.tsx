import { auth } from "@/auth";
import { QuickPostFeed } from "@/components/home/QuickPostFeed";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import { getQuickPostsByType, type QuickPostType } from "@/lib/actions/quick-post";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

const archiveTypes = {
  pandangan: "NORMAL",
  agenda: "AGENDA",
  kutipan: "QUOTE",
} as const satisfies Record<string, QuickPostType>;

type ArchiveSlug = keyof typeof archiveTypes;
type ArchivePageParams = Promise<{ lang: string; type: string }>;

function isArchiveSlug(value: string): value is ArchiveSlug {
  return value in archiveTypes;
}

function getArchiveCopy(
  slug: ArchiveSlug,
  dict: Awaited<ReturnType<typeof getDictionary>>,
) {
  if (slug === "pandangan") {
    return { title: dict.quickPost.normal, intro: dict.quickPost.normalIntro };
  }
  if (slug === "agenda") {
    return { title: dict.quickPost.agenda, intro: dict.quickPost.agendaIntro };
  }
  return { title: dict.quickPost.quote, intro: dict.quickPost.quoteIntro };
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

export function generateStaticParams() {
  return Object.keys(archiveTypes).map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: ArchivePageParams }): Promise<Metadata> {
  const { lang: rawLang, type: rawType } = await params;
  if (!hasLocale(rawLang) || !isArchiveSlug(rawType)) return {};

  const dict = await getDictionary(rawLang);
  const copy = getArchiveCopy(rawType, dict);
  return createPageMetadata({
    title: `${copy.title} | BRH Insight`,
    description: copy.intro,
    path: `/${rawLang}/catatan/${rawType}`,
    locale: rawLang,
    absoluteTitle: true,
  });
}

async function ArchiveFeed({
  lang,
  type,
  dict,
}: {
  lang: Locale;
  type: QuickPostType;
  dict: Awaited<ReturnType<typeof getDictionary>>;
}) {
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
      visibleTypes={[type]}
      variant="full"
    />
  );
}

function ArchiveFeedFallback() {
  return <div className="mx-auto min-h-96 max-w-3xl animate-pulse rounded-[1.75rem] border border-outline-variant/25 bg-surface-container-low" />;
}

export default async function QuickPostArchivePage({ params }: { params: ArchivePageParams }) {
  const { lang: rawLang, type: rawType } = await params;
  if (!hasLocale(rawLang) || !isArchiveSlug(rawType)) notFound();

  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);
  const copy = getArchiveCopy(rawType, dict);

  return (
    <main className="min-h-screen bg-surface px-4 pb-24 pt-8 sm:px-6 sm:pt-12 md:px-12 lg:px-24 lg:pt-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-outline-variant/30 pb-6 sm:mb-10 sm:pb-8">
          <OptimisticLink
            href={`/${lang}/catatan`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-4 text-[11px] font-black uppercase tracking-wider text-on-surface-variant transition hover:border-secondary/40 hover:bg-secondary/10 hover:text-secondary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[17px]">west</span>
            {dict.quickPost.backToAll}
          </OptimisticLink>

          <div className="mt-8 max-w-3xl">
            <span className="font-label text-[10px] font-black uppercase tracking-[0.28em] text-secondary sm:text-xs">
              {dict.quickPost.eyebrow}
            </span>
            <h1 className="mt-3 font-headline text-4xl font-black leading-tight tracking-tight text-primary sm:text-5xl md:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-on-surface-variant/72 sm:text-base">
              {copy.intro}
            </p>
          </div>
        </header>

        <Suspense fallback={<ArchiveFeedFallback />}>
          <ArchiveFeed lang={lang} type={archiveTypes[rawType]} dict={dict} />
        </Suspense>
      </div>
    </main>
  );
}
