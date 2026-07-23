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
import { researchAreas } from '@/lib/brh-content';

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
  const plainContent = post.blocks
    ?.filter((block) => block.type === 'text' && block.content)
    .map((block) => block.content!.replace(/<[^>]*>?/gm, ' '))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim() || '';

  return plainContent
    ? plainContent.substring(0, 600) + (plainContent.length > 600 ? '...' : '')
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
    teaching: dict.quickPost.teaching,
    engagement: dict.quickPost.engagement,
    agendaCategory: dict.quickPost.agendaCategory,
    agendaCategoryRequired: dict.quickPost.agendaCategoryRequired,
    openTeachingLink: dict.quickPost.openTeachingLink,
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
    agendaLink: dict.quickPost.agendaLink,
    agendaLinkPlaceholder: dict.quickPost.agendaLinkPlaceholder,
    agendaLinkHint: dict.quickPost.agendaLinkHint,
    agendaLocation: dict.quickPost.agendaLocation,
    agendaLocationPlaceholder: dict.quickPost.agendaLocationPlaceholder,
    addressSearching: dict.quickPost.addressSearching,
    addressNoResults: dict.quickPost.addressNoResults,
    addressSearchError: dict.quickPost.addressSearchError,
    addressPoweredBy: dict.quickPost.addressPoweredBy,
  };
}

async function getHeroPanelItems(lang: Locale, dict: Awaited<ReturnType<typeof getDictionary>>): Promise<HeroPanelItem[]> {
  void lang;
  void dict;
  const latestQuote = await getLatestPublishedQuickPostByType("QUOTE");

  if (latestQuote) {
    return [{
      kind: "quote",
      id: latestQuote.id,
      content: latestQuote.content,
      createdAt: latestQuote.createdAt,
    }];
  }

  return [];
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
  const teachingPosts = {
    ...quickPosts,
    AGENDA: quickPosts.AGENDA.filter((post) => post.agendaCategory === "TEACHING"),
  };
  const engagementPosts = {
    ...quickPosts,
    AGENDA: quickPosts.AGENDA.filter((post) => post.agendaCategory === "ENGAGEMENT"),
  };
  const copy = lang === "id"
    ? {
        eyebrow: "PENGAJARAN & PENGABDIAN",
        title: "Agenda Pengajaran & Pengabdian",
        intro: "Agenda akademik dan kegiatan publik BRH dalam dua ruang yang saling melengkapi.",
      }
    : {
        eyebrow: "TEACHING & ENGAGEMENT",
        title: "Teaching & Engagement Agenda",
        intro: "BRH academic agenda and public activities, organized into two complementary spaces.",
      };

  return (
    <section className="w-full bg-surface-container-lowest px-4 py-12 sm:px-6 md:px-12 lg:px-16 lg:py-20 xl:px-24">
      <div className="mx-auto w-full max-w-[1600px]">
        <ScrollReveal className="mb-8 border-b border-outline-variant/30 pb-6">
          <span className="font-label text-[10px] font-black uppercase tracking-[0.28em] text-secondary sm:text-xs">{copy.eyebrow}</span>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-3xl font-headline text-3xl font-black tracking-tight text-primary md:text-5xl">{copy.title}</h2>
            <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant/70 sm:text-base">{copy.intro}</p>
          </div>
        </ScrollReveal>
        <div className="grid gap-6 lg:grid-cols-2">
          <QuickPostFeed
            quickPosts={teachingPosts}
            isAdmin={isAdmin}
            lang={lang}
            labels={{ ...quickPostFeedLabels, agenda: dict.quickPost.teaching }}
            archiveHrefs={{ AGENDA: withLocale("/pengabdian", lang) }}
            visibleTypes={["AGENDA"]}
            variant="preview"
          />
          <QuickPostFeed
            quickPosts={engagementPosts}
            isAdmin={isAdmin}
            lang={lang}
            labels={{ ...quickPostFeedLabels, agenda: dict.quickPost.engagement }}
            archiveHrefs={{ AGENDA: withLocale("/pengabdian", lang) }}
            visibleTypes={["AGENDA"]}
            variant="preview"
          />
        </div>
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
  const highlightedPosts = (await getHomeFeaturedPosts(3)).map((post) => localizePost(post, lang) as LocalizedHomePost);

  return (
    <section id="highlight" className="flex min-h-[100svh] w-full items-center border-y border-outline-variant/25 bg-surface-container-lowest px-4 py-10 sm:px-6 md:px-12 lg:min-h-[calc(100svh-3.5rem)] lg:px-16 lg:py-12 xl:px-24">
      <div className="mx-auto w-full max-w-[1600px]">
        <ArchiveSectionHeader eyebrow={dict.home.highlightEyebrow} titleA={dict.home.highlightTitleA} titleB={dict.home.highlightTitleB} lang={lang} dict={dict} />
        {highlightedPosts.length > 0 ? (
          <div className="-mx-4 grid snap-x snap-mandatory auto-cols-[82vw] grid-flow-col gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:auto-cols-[44vw] sm:px-6 lg:mx-0 lg:grid-flow-row lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0">
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
  const latestPosts = (await getPublishedPosts({ limit: 3 })).map((post) => localizePost(post, lang) as LocalizedHomePost);

  return (
    <section id="arsip" className="flex min-h-[100svh] w-full items-center bg-surface px-4 py-10 sm:px-6 md:px-12 lg:min-h-[calc(100svh-3.5rem)] lg:px-16 lg:py-12 xl:px-24">
      <div className="mx-auto w-full max-w-[1600px]">
        <ScrollReveal className="mb-6 flex justify-end sm:mb-8">
          <OptimisticLink href={withLocale("/publikasi", lang)} className="tap-target inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-on-primary transition hover:bg-tertiary">
            {dict.home.viewAll}
            <span className="material-symbols-outlined text-[19px]">east</span>
          </OptimisticLink>
        </ScrollReveal>
        {latestPosts.length > 0 ? (
          <div data-latest-updates-list className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {latestPosts.map((post, index) => {
              const snippet = getPostSnippet(post);
              return (
                <ScrollReveal key={post.id} delay={(index % 4) * 0.04} className="h-full w-full sm:snap-start">
                  <OptimisticLink data-latest-update-card href={withLocale(`/post/${post.slug}`, lang)} className="surface-lift-hover group grid min-h-[18rem] w-full grid-cols-[10rem_minmax(0,1fr)] overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-container-lowest sm:min-h-[20rem] sm:grid-cols-[12.5rem_minmax(0,1fr)] lg:min-h-[24rem] lg:grid-cols-[50%_minmax(0,1fr)] xl:min-h-[26rem]">
                    <div className="relative aspect-square w-full self-start overflow-hidden bg-surface-container">
                      {post.thumbnail ? (
                        <Image src={post.thumbnail} alt={post.title} fill sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 25vw" className="object-contain p-1.5 transition duration-700 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><span className="material-symbols-outlined text-3xl text-secondary/30">menu_book</span></div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col p-4 sm:p-5 xl:p-6">
                      <PublicationMeta post={post} lang={lang} dict={dict} />
                      <h3 className="mt-3 line-clamp-3 text-pretty font-headline text-lg font-black leading-tight text-primary transition group-hover:text-tertiary xl:text-xl">{post.title}</h3>
                      {snippet && <p className="mt-3 line-clamp-7 text-sm leading-relaxed text-on-surface-variant/70 sm:line-clamp-8 lg:line-clamp-9">{snippet}</p>}
                      <span className="mt-auto flex items-center gap-1.5 pt-4 text-[9px] font-black uppercase tracking-widest text-secondary">{dict.home.readMore}<span className="material-symbols-outlined text-[15px] transition group-hover:translate-x-1">east</span></span>
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

function HomeResearchSection({ lang }: { lang: Locale }) {
  const researchImages = [
    "https://m0mix0w8bt.ufs.sh/f/4o6HWCjH0s2pdC7ufxL4JvU5zpxi8TNk9KHEBeslZ2LVRMoy",
    "https://m0mix0w8bt.ufs.sh/f/4o6HWCjH0s2pb6ajnC71dZjpRBisoNvfwOK7agXYk8LE9PC0",
    "https://m0mix0w8bt.ufs.sh/f/4o6HWCjH0s2p5TOThnFamTrS9QJwj87LXRqnOyvNV1uhzFWH",
  ];
  const copy = lang === "id"
    ? {
        title: "Riset untuk Peradaban yang Lebih Manusiawi",
        intro: "Menjelajahi hubungan spiritualitas, kesejahteraan sosial, kepemimpinan moral, dan masa depan peradaban.",
        cta: "Jelajahi seluruh riset",
      }
    : {
        title: "Research for a More Humane Civilization",
        intro: "Exploring spirituality, social welfare, moral leadership, and the future of civilization.",
        cta: "Explore all research",
      };

  return (
    <section className="w-full bg-tertiary px-4 py-14 text-background sm:px-6 md:px-12 lg:px-24 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="grid gap-6 border-b border-background/15 pb-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(320px,0.45fr)] lg:items-end">
          <div>
            <h2 className="max-w-3xl font-headline text-3xl font-black leading-tight tracking-tight md:text-5xl">{copy.title}</h2>
          </div>
          <p className="text-sm leading-relaxed text-background/70 sm:text-base">{copy.intro}</p>
        </ScrollReveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {researchAreas.slice(0, 3).map((area, index) => (
            <ScrollReveal key={area.title.id} delay={index * 0.06} className="h-full">
              <OptimisticLink href={withLocale("/riset", lang)} className="block h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-background/15 bg-background/6 transition duration-300 hover:-translate-y-1 hover:border-secondary-fixed/40 hover:bg-background/10 hover:shadow-[0_24px_60px_-32px_rgba(0,0,0,0.7)]">
                  <div className="relative aspect-square w-full overflow-hidden bg-background/10">
                    <Image
                      src={researchImages[index]}
                      alt={area.title[lang]}
                      fill
                      sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1279px) 33vw, 400px"
                      className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-tertiary/35 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-background/25 bg-tertiary/80 px-3 font-label text-[10px] font-black tracking-[0.16em] text-secondary-fixed backdrop-blur-sm">
                      0{index + 1}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="font-headline text-xl font-black leading-tight text-background sm:text-2xl">{area.title[lang]}</h3>
                    <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-background/70">{area.description[lang]}</p>
                    <span className="mt-auto flex items-center gap-2 pt-6 text-[10px] font-black uppercase tracking-[0.16em] text-secondary-fixed">
                      {copy.cta}
                      <span className="material-symbols-outlined text-[17px] transition group-hover:translate-x-1">east</span>
                    </span>
                  </div>
                </article>
              </OptimisticLink>
            </ScrollReveal>
          ))}
        </div>
        <OptimisticLink href={withLocale("/riset", lang)} className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-secondary-fixed px-5 text-sm font-black text-on-secondary-fixed transition hover:-translate-y-0.5">
          {copy.cta}
          <span className="material-symbols-outlined text-[18px]">east</span>
        </OptimisticLink>
      </div>
    </section>
  );
}

function HomeContactSection({ lang }: { lang: Locale }) {
  const copy = lang === "id"
    ? {
        eyebrow: "KONTAK",
        title: "Mari Terhubung",
        intro: "Untuk korespondensi akademik, kolaborasi riset, pengajaran, dan kegiatan publik.",
        cta: "Buka halaman kontak",
      }
    : {
        eyebrow: "CONTACT",
        title: "Let’s Connect",
        intro: "For academic correspondence, research collaboration, teaching, and public engagement.",
        cta: "Open contact page",
      };

  return (
    <section className="w-full px-4 py-14 sm:px-6 md:px-12 lg:px-24 lg:py-24">
      <ScrollReveal className="mx-auto grid max-w-7xl gap-8 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.45fr)] lg:items-end">
        <div>
          <span className="font-label text-[10px] font-black uppercase tracking-[0.28em] text-secondary sm:text-xs">{copy.eyebrow}</span>
          <h2 className="mt-3 font-headline text-3xl font-black tracking-tight text-primary md:text-5xl">{copy.title}</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-on-surface-variant/75">{copy.intro}</p>
        </div>
        <div className="flex flex-col items-start gap-4 lg:items-end">
          <a href="mailto:budi.rahman@uinjkt.ac.id" className="text-sm font-black text-secondary hover:text-primary">budi.rahman@uinjkt.ac.id</a>
          <OptimisticLink href={withLocale("/kontak", lang)} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-on-primary transition hover:bg-tertiary">
            {copy.cta}
            <span className="material-symbols-outlined text-[18px]">east</span>
          </OptimisticLink>
        </div>
      </ScrollReveal>
    </section>
  );
}

function HomeStreamedContent({ lang, dict }: { lang: Locale; dict: Awaited<ReturnType<typeof getDictionary>> }) {
  return (
    <>
      <Suspense fallback={<section className="w-full px-4 py-10 sm:px-6 sm:py-14 md:px-12 lg:px-24 lg:py-24"><SectionSkeleton variant="media" /></section>}>
        <HomeBiographySection lang={lang} dict={dict} />
      </Suspense>
      <Suspense fallback={<section className="flex min-h-[100svh] w-full items-center bg-surface px-4 py-10 sm:px-6 md:px-12 lg:px-24"><SectionSkeleton variant="cards" /></section>}>
        <HomeLatestUpdatesSection lang={lang} dict={dict} />
      </Suspense>
      <Suspense fallback={<section className="flex min-h-[100svh] w-full items-center border-y border-outline-variant/25 bg-surface-container-lowest px-4 py-10 sm:px-6 md:px-12 lg:px-24"><SectionSkeleton variant="cards" /></section>}>
        <HomeHighlightSection lang={lang} dict={dict} />
      </Suspense>
      <HomeResearchSection lang={lang} />
      <Suspense fallback={
        <section className="flex w-full px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3 sm:px-6 sm:pb-8 sm:pt-5 md:px-12 lg:min-h-[calc(100svh-3.5rem)] lg:items-center lg:py-10 xl:px-16 2xl:px-24">
          <div className="mx-auto w-full max-w-[1600px]">
            <SectionSkeleton variant="compact" />
          </div>
        </section>
      }>
        <HomeQuickPostsSection lang={lang} dict={dict} />
      </Suspense>
      <HomeContactSection lang={lang} />
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
