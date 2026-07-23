import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { connection } from 'next/server';
import { getHomeFeaturedPosts, getLatestPublishedQuickPostByType, getPublishedPosts } from '@/lib/data/public-content';
import { getQuickPostsByType } from '@/lib/actions/quick-post';
import HomeHero from '@/components/home/HomeHero';
import { QuickPostFeed } from '@/components/home/QuickPostFeed';
import { formatLocalizedDate, hasLocale, withLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getCategoryLabel, localizePost } from '@/lib/i18n/posts';
import { notFound } from 'next/navigation';
import { RouteSkeleton } from '@/components/ui/RouteSkeleton';
import { OptimisticLink } from '@/components/navigation/NavigationFeedback';
import { SectionSkeleton } from '@/components/ui/SectionSkeleton';
import { createPageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import {
  getWebsiteStructuredData,
  serializeStructuredData,
} from '@/lib/structured-data';

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

const ScrollReveal = dynamic(() => import('@/components/home/ScrollReveal'), {
  ssr: true,
});

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) return { title: { absolute: "Budi Rahman Hakim" } };

  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);

  return createPageMetadata({
    title: dict.metadata.title,
    description: dict.metadata.description,
    path: `/${lang}`,
    locale: lang,
    absoluteTitle: true,
  });
}

type LocalizedHomePost = {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail?: string | null;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  blocks?: Array<{
    type: string;
    content?: string | null;
  }>;
};

type HeroPanelItem =
  | {
      kind: "quote" | "insight";
      id: string;
      content: string;
      imageUrl?: string | null;
      createdAt: Date | string;
    }
  | {
      kind: "article";
      id: string;
      title: string;
      excerpt: string;
      href: string;
      category: string;
      thumbnail?: string | null;
      createdAt: Date | string;
    };

function getPostSnippet(post: LocalizedHomePost) {
  const firstTextBlock = post.blocks?.find((block) => block.type === 'text');
  const plainContent = firstTextBlock?.content ? firstTextBlock.content.replace(/<[^>]*>?/gm, '') : '';
  return plainContent
    ? plainContent.substring(0, 170) + (plainContent.length > 170 ? '...' : '')
    : '';
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
    deleteConfirmTitle: dict.quickPost.deleteConfirmTitle,
    deleteConfirmDescription: dict.quickPost.deleteConfirmDescription,
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

async function getHeroPanelItems(lang: Locale, dict: Awaited<ReturnType<typeof getDictionary>>): Promise<HeroPanelItem[]> {
  const [latestQuote, latestInsight, latestPosts] = await Promise.all([
    getLatestPublishedQuickPostByType("QUOTE"),
    getLatestPublishedQuickPostByType("NORMAL"),
    getPublishedPosts({ excludeCategory: "Buku", limit: 1 }),
  ]);

  const items: HeroPanelItem[] = [];

  if (latestQuote) {
    items.push({
      kind: "quote",
      id: latestQuote.id,
      content: latestQuote.content,
      createdAt: latestQuote.createdAt,
    });
  }

  if (latestInsight) {
    items.push({
      kind: "insight",
      id: latestInsight.id,
      content: latestInsight.content,
      imageUrl: latestInsight.imageUrl,
      createdAt: latestInsight.createdAt,
    });
  }

  const latestPost = latestPosts[0];
  if (latestPost) {
    const localizedPost = localizePost(latestPost, lang) as LocalizedHomePost;
    items.push({
      kind: "article",
      id: localizedPost.id,
      title: localizedPost.title,
      excerpt: getPostSnippet(localizedPost),
      href: withLocale(`/post/${localizedPost.slug}`, lang),
      category: getCategoryLabel(localizedPost.category, dict.explore.categories),
      thumbnail: localizedPost.thumbnail,
      createdAt: localizedPost.publishedAt || localizedPost.createdAt,
    });
  }

  return items;
}

async function HomeQuickPostsSection({ lang, dict }: { lang: Locale; dict: Awaited<ReturnType<typeof getDictionary>> }) {
  await connection();
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const quickPosts = await getQuickPostsByType({
    includeDrafts: isAdmin,
    limitPerType: 3,
    upcomingAgendaOnly: true,
  });
  const quickPostFeedLabels = getQuickPostFeedLabels(dict);

  return (
    <section className="flex w-full px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3 sm:px-6 sm:pb-8 sm:pt-5 md:px-12 lg:min-h-[calc(100svh-3.5rem)] lg:items-center lg:py-10 xl:px-16 2xl:px-24">
      <div className="mx-auto w-full max-w-[1600px]">
        <QuickPostFeed
          quickPosts={quickPosts}
          isAdmin={isAdmin}
          lang={lang}
          labels={quickPostFeedLabels}
          archiveHrefs={{
            NORMAL: withLocale("/catatan/pandangan", lang),
            AGENDA: withLocale("/catatan/agenda", lang),
            QUOTE: withLocale("/catatan/kutipan", lang),
          }}
          variant="preview"
        />
      </div>
    </section>
  );
}

function PublicationMeta({ post, lang, dict }: { post: LocalizedHomePost; lang: Locale; dict: Awaited<ReturnType<typeof getDictionary>> }) {
  return (
    <div className="flex flex-wrap items-center gap-2 font-label text-[9px] font-black uppercase tracking-[0.15em] text-secondary sm:text-[10px]">
      <span>{getCategoryLabel(post.category, dict.explore.categories)}</span>
      <span className="h-px w-5 bg-outline-variant" />
      <span className="tracking-normal text-on-surface-variant/55">
        {formatLocalizedDate(post.publishedAt || post.createdAt, lang)}
      </span>
    </div>
  );
}

function ArchiveSectionHeader({
  eyebrow,
  titleA,
  titleB,
  lang,
  dict,
}: {
  eyebrow: string;
  titleA: string;
  titleB: string;
  lang: Locale;
  dict: Awaited<ReturnType<typeof getDictionary>>;
}) {
  return (
    <ScrollReveal className="mb-6 flex flex-col gap-4 border-b border-outline-variant/35 pb-5 sm:mb-8 sm:pb-7 md:flex-row md:items-end md:justify-between">
      <div>
        <span className="font-label text-[10px] font-black uppercase tracking-[0.24em] text-secondary sm:text-xs sm:tracking-[0.28em]">{eyebrow}</span>
        <h2 className="mt-2 max-w-3xl font-headline text-3xl font-black leading-tight tracking-tight text-primary sm:mt-3 md:text-5xl">
          {titleA} <span className="text-tertiary">{titleB}</span>
        </h2>
      </div>
      <OptimisticLink href={withLocale("/explore", lang)} className="tap-target inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-on-primary transition hover:bg-tertiary active:scale-[0.98]">
        {dict.home.viewAll}
        <span className="material-symbols-outlined text-[19px]">grid_view</span>
      </OptimisticLink>
    </ScrollReveal>
  );
}

function EmptyArchive({ dict }: { dict: Awaited<ReturnType<typeof getDictionary>> }) {
  return (
    <ScrollReveal>
      <div className="border-y border-dashed border-outline-variant/40 py-12 text-center sm:py-16">
        <span className="material-symbols-outlined text-4xl text-secondary/35 sm:text-5xl">inventory_2</span>
        <h3 className="mt-4 text-xl font-black tracking-tight text-primary sm:text-2xl">{dict.home.emptyTitle}</h3>
        <p className="mx-auto mt-2 max-w-sm text-on-surface-variant/65">{dict.home.emptyDescription}</p>
      </div>
    </ScrollReveal>
  );
}

async function HomeHighlightSection({ lang, dict }: { lang: Locale; dict: Awaited<ReturnType<typeof getDictionary>> }) {
  const highlightedPosts = (await getHomeFeaturedPosts(5)).map((post) => localizePost(post, lang) as LocalizedHomePost);

  return (
    <section id="highlight" className="flex min-h-[100svh] w-full items-center border-y border-outline-variant/25 bg-surface-container-lowest px-4 py-10 sm:px-6 md:px-12 lg:min-h-[calc(100svh-3.5rem)] lg:px-16 lg:py-12 xl:px-24">
      <div className="mx-auto w-full max-w-[1600px]">
        <ArchiveSectionHeader eyebrow={dict.home.highlightEyebrow} titleA={dict.home.highlightTitleA} titleB={dict.home.highlightTitleB} lang={lang} dict={dict} />
        {highlightedPosts.length > 0 ? (
          <div className="-mx-4 grid snap-x snap-mandatory auto-cols-[82vw] grid-flow-col gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:auto-cols-[44vw] sm:px-6 lg:mx-0 lg:grid-flow-row lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0 xl:gap-5">
            {highlightedPosts.map((post, index) => (
              <ScrollReveal key={post.id} delay={index * 0.06} className="snap-start">
                <OptimisticLink href={withLocale(`/post/${post.slug}`, lang)} className="surface-lift-hover group flex h-full flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface">
                  <div className="relative aspect-square w-full overflow-hidden bg-surface-container">
                    {post.thumbnail ? (
                      <Image src={post.thumbnail} alt={post.title} fill sizes="(max-width: 640px) 82vw, (max-width: 1024px) 44vw, 20vw" className="object-contain p-2 transition duration-700 group-hover:scale-[1.03]" priority={index < 2} />
                    ) : (
                      <div className="flex h-full items-center justify-center"><span className="material-symbols-outlined text-5xl text-secondary/30">menu_book</span></div>
                    )}
                    <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-black text-on-primary shadow-sm">{index + 1}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-4 xl:p-5">
                    <PublicationMeta post={post} lang={lang} dict={dict} />
                    <h3 className="mt-3 line-clamp-3 text-pretty font-headline text-lg font-black leading-tight text-primary transition group-hover:text-tertiary xl:text-xl">{post.title}</h3>
                    <span className="mt-auto flex items-center gap-2 pt-5 text-[10px] font-black uppercase tracking-widest text-secondary">{dict.home.readMore}<span className="material-symbols-outlined text-[16px] transition group-hover:translate-x-1">east</span></span>
                  </div>
                </OptimisticLink>
              </ScrollReveal>
            ))}
          </div>
        ) : <EmptyArchive dict={dict} />}
      </div>
    </section>
  );
}

async function HomeLatestUpdatesSection({ lang, dict }: { lang: Locale; dict: Awaited<ReturnType<typeof getDictionary>> }) {
  const latestPosts = (await getPublishedPosts({ limit: 8 })).map((post) => localizePost(post, lang) as LocalizedHomePost);

  return (
    <section id="arsip" className="flex min-h-[100svh] w-full items-center bg-surface px-4 py-10 sm:px-6 md:px-12 lg:min-h-[calc(100svh-3.5rem)] lg:px-16 lg:py-12 xl:px-24">
      <div className="mx-auto w-full max-w-[1600px]">
        <ArchiveSectionHeader eyebrow={dict.home.latestEyebrow} titleA={dict.home.latestTitleA} titleB={dict.home.latestTitleB} lang={lang} dict={dict} />
        {latestPosts.length > 0 ? (
          <div data-latest-updates-list className="grid grid-cols-1 gap-3 sm:-mx-6 sm:snap-x sm:snap-mandatory sm:auto-cols-[58vw] sm:grid-flow-col sm:grid-cols-none sm:grid-rows-2 sm:overflow-x-auto sm:px-6 sm:pb-3 lg:mx-0 lg:grid-flow-row lg:grid-cols-4 lg:grid-rows-none lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
            {latestPosts.map((post, index) => {
              const snippet = getPostSnippet(post);
              return (
                <ScrollReveal key={post.id} delay={(index % 4) * 0.04} className="w-full sm:snap-start">
                  <OptimisticLink data-latest-update-card href={withLocale(`/post/${post.slug}`, lang)} className="surface-lift-hover group grid h-36 w-full grid-cols-[8.5rem_minmax(0,1fr)] overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-container-lowest sm:h-full sm:min-h-36 sm:grid-cols-[9.5rem_minmax(0,1fr)] lg:min-h-0 lg:grid-cols-[42%_minmax(0,1fr)]">
                    <div className="relative aspect-square w-full self-start overflow-hidden bg-surface-container">
                      {post.thumbnail ? (
                        <Image src={post.thumbnail} alt={post.title} fill sizes="(max-width: 640px) 136px, (max-width: 1024px) 152px, 12vw" className="object-contain p-1.5 transition duration-700 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><span className="material-symbols-outlined text-3xl text-secondary/30">menu_book</span></div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col p-3.5 xl:p-4">
                      <PublicationMeta post={post} lang={lang} dict={dict} />
                      <h3 className="mt-2 line-clamp-2 text-pretty font-headline text-base font-black leading-tight text-primary transition group-hover:text-tertiary xl:text-lg">{post.title}</h3>
                      {snippet && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-on-surface-variant/65">{snippet}</p>}
                      <span className="mt-auto flex items-center gap-1.5 pt-2 text-[9px] font-black uppercase tracking-widest text-secondary">{dict.home.readMore}<span className="material-symbols-outlined text-[15px] transition group-hover:translate-x-1">east</span></span>
                    </div>
                  </OptimisticLink>
                </ScrollReveal>
              );
            })}
          </div>
        ) : <EmptyArchive dict={dict} />}
      </div>
    </section>
  );
}

function HomeBiographySection({ lang, dict }: { lang: Locale; dict: Awaited<ReturnType<typeof getDictionary>> }) {
  return (
    <section className="w-full px-4 py-10 sm:px-6 sm:py-14 md:px-12 lg:px-24 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 border-y border-outline-variant/35 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
          <ScrollReveal>
              <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-container shadow-[0_14px_45px_rgba(41,47,54,0.08)]">
              <Image
                src="/budi-rahman-hakim.jpg"
                alt="Assoc. Prof. Budi Rahman Hakim, S.Ag., M.S.W., Ph.D."
                fill
                sizes="(max-width: 1024px) 100vw, 320px"
                className="object-cover grayscale transition duration-700 hover:grayscale-0"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.12}>
            <span className="font-label text-xs font-black uppercase tracking-[0.28em] text-secondary">
              {dict.home.biographyEyebrow}
            </span>
            <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.7fr)] lg:items-start">
              <div>
                <h2
                  aria-label="Assoc. Prof. Budi Rahman Hakim, S.Ag., M.S.W., Ph.D."
                  className="font-headline font-black leading-tight tracking-tight text-primary"
                >
                  <span className="mb-2 block font-label text-sm font-bold uppercase tracking-[0.3em] text-secondary md:text-base">
                    Assoc. Prof.
                  </span>
                  <span className="block text-3xl md:text-5xl">
                    Budi Rahman <span className="text-secondary">Hakim</span>
                  </span>
                  <span className="mt-3 block font-label text-base font-semibold tracking-[0.14em] text-on-surface/60 md:text-lg">
                    S.Ag., M.S.W., Ph.D.
                  </span>
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                  {dict.home.biographyCopy}
                </p>
                <OptimisticLink
                  href={withLocale("/biografi", lang)}
                  className="mt-7 inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary transition hover:text-secondary"
                >
                  {dict.home.biographyCta}
                  <span className="material-symbols-outlined text-[18px]">east</span>
                </OptimisticLink>
              </div>

              <figure className="border-l-0 border-outline-variant/35 pt-2 lg:border-l lg:pl-8">
                <span className="material-symbols-outlined text-4xl text-secondary/45">format_quote</span>
                <blockquote className="mt-4 text-pretty font-headline text-xl font-black italic leading-snug text-tertiary md:text-2xl">
                  Penghancur kehidupanmu itu seringkali bukan orang lain tapi dirimu sendiri, karena pikiranmu sendiri.
                </blockquote>
                <figcaption className="mt-5 font-label text-xs font-black uppercase tracking-[0.24em] text-secondary">
                  {dict.home.quoteAuthor}
                </figcaption>
              </figure>
            </div>
          </ScrollReveal>
        </div>
      </section>
  );
}

function HomeStreamedContent({ lang, dict }: { lang: Locale; dict: Awaited<ReturnType<typeof getDictionary>> }) {
  return (
    <>
      <Suspense fallback={
        <section className="flex w-full px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3 sm:px-6 sm:pb-8 sm:pt-5 md:px-12 lg:min-h-[calc(100svh-3.5rem)] lg:items-center lg:py-10 xl:px-16 2xl:px-24">
          <div className="mx-auto w-full max-w-[1600px]">
            <SectionSkeleton variant="compact" />
          </div>
        </section>
      }>
        <HomeQuickPostsSection lang={lang} dict={dict} />
      </Suspense>
      <Suspense fallback={<section className="flex min-h-[100svh] w-full items-center border-y border-outline-variant/25 bg-surface-container-lowest px-4 py-10 sm:px-6 md:px-12 lg:px-24"><SectionSkeleton variant="cards" /></section>}>
        <HomeHighlightSection lang={lang} dict={dict} />
      </Suspense>
      <Suspense fallback={<section className="flex min-h-[100svh] w-full items-center bg-surface px-4 py-10 sm:px-6 md:px-12 lg:px-24"><SectionSkeleton variant="cards" /></section>}>
        <HomeLatestUpdatesSection lang={lang} dict={dict} />
      </Suspense>
      <Suspense fallback={<section className="w-full px-4 py-10 sm:px-6 sm:py-14 md:px-12 lg:px-24 lg:py-24"><SectionSkeleton variant="media" /></section>}>
        <HomeBiographySection lang={lang} dict={dict} />
      </Suspense>
    </>
  );
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();

  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);
  const heroPanelItems = await getHeroPanelItems(lang, dict);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeStructuredData(getWebsiteStructuredData()),
        }}
      />
      <div className="overflow-x-hidden bg-surface pb-24 sm:pb-0">
        <HomeHero
          lang={lang}
          home={dict.home}
          search={dict.search}
          heroPanelItems={heroPanelItems}
          heroPanelLabels={dict.home.heroPanel}
        />
        <Suspense fallback={<RouteSkeleton />}>
          <HomeStreamedContent lang={lang} dict={dict} />
        </Suspense>
      </div>
    </>
  );
}
