import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { auth } from '@/auth';
import { getPosts } from '@/lib/actions/post';
import { getQuickPosts } from '@/lib/actions/quick-post';
import HomeHero from '@/components/home/HomeHero';
import { QuickPostFeed } from '@/components/home/QuickPostFeed';
import { formatLocalizedDate, hasLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getCategoryLabel, localizePost } from '@/lib/i18n/posts';
import { notFound } from 'next/navigation';

const ScrollReveal = dynamic(() => import('@/components/home/ScrollReveal'), {
  ssr: true,
});

type LocalizedHomePost = {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail?: string | null;
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
    }
  | null;

function getPostSnippet(post: LocalizedHomePost) {
  const firstTextBlock = post.blocks?.find((block) => block.type === 'text');
  const plainContent = firstTextBlock?.content ? firstTextBlock.content.replace(/<[^>]*>?/gm, '') : '';
  return plainContent
    ? plainContent.substring(0, 170) + (plainContent.length > 170 ? '...' : '')
    : '';
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();

  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const quickPosts = await getQuickPosts({ includeDrafts: isAdmin, limit: 12 });
  const allPosts = await getPosts({ status: 'Published', locale: lang });
  const latestPosts = allPosts.slice(0, 4).map((post) => localizePost(post, lang) as LocalizedHomePost);
  const latestQuote = quickPosts.find((post) => post.type === "QUOTE");
  const latestInsight = quickPosts.find((post) => post.type !== "QUOTE");
  const latestArticle = latestPosts[0];
  const heroPanelItem: HeroPanelItem = latestQuote
    ? {
        kind: "quote",
        id: latestQuote.id,
        content: latestQuote.content,
        createdAt: latestQuote.createdAt,
      }
    : latestInsight
      ? {
          kind: "insight",
          id: latestInsight.id,
          content: latestInsight.content,
          imageUrl: latestInsight.imageUrl,
          createdAt: latestInsight.createdAt,
        }
      : latestArticle
        ? {
            kind: "article",
            id: latestArticle.id,
            title: latestArticle.title,
            excerpt: getPostSnippet(latestArticle),
            href: `/${lang}/post/${latestArticle.slug}`,
            category: getCategoryLabel(latestArticle.category, dict.explore.categories),
            thumbnail: latestArticle.thumbnail,
            createdAt: latestArticle.createdAt,
          }
        : null;
  const quickPostFeedLabels = {
    emptyTitle: dict.quickPost.emptyTitle,
    emptyDescription: dict.quickPost.emptyDescription,
    normal: dict.quickPost.normal,
    quote: dict.quickPost.quote,
    readMore: dict.quickPost.readMore,
    showLess: dict.quickPost.showLess,
    draftBadge: dict.quickPost.draftBadge,
    publish: dict.quickPost.publish,
    edit: dict.quickPost.edit,
    save: dict.quickPost.save,
    cancel: dict.quickPost.cancel,
    delete: dict.quickPost.delete,
  };

  return (
    <div className="overflow-x-hidden bg-surface pb-24 sm:pb-0">
      <HomeHero
        lang={lang}
        home={dict.home}
        search={dict.search}
        heroPanelItem={heroPanelItem}
        heroPanelLabels={dict.home.heroPanel}
      />

      <section className="w-full px-4 py-8 sm:px-6 sm:py-12 md:px-12 lg:px-24 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <QuickPostFeed
            quickPosts={quickPosts}
            isAdmin={isAdmin}
            lang={lang}
            labels={quickPostFeedLabels}
          />
        </div>
      </section>

      <section id="arsip" className="w-full bg-surface-container-lowest px-4 py-10 sm:px-6 sm:py-14 md:px-12 lg:px-24 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="mb-6 flex flex-col gap-4 border-b border-outline-variant/35 pb-6 sm:mb-8 sm:gap-5 sm:pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="font-label text-[10px] font-black uppercase tracking-[0.24em] text-secondary sm:text-xs sm:tracking-[0.28em]">
                {dict.home.archiveEyebrow}
              </span>
              <h2 className="mt-3 max-w-3xl font-headline text-3xl font-black leading-tight tracking-tight text-primary sm:mt-4 md:text-5xl">
                {dict.home.archiveTitleA} <span className="text-tertiary">{dict.home.archiveTitleB}</span>
              </h2>
            </div>
            <Link
              href={`/${lang}/explore`}
              className="inline-flex h-12 w-fit items-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-on-primary transition hover:bg-tertiary"
            >
              {dict.home.viewAll}
              <span className="material-symbols-outlined text-[19px]">grid_view</span>
            </Link>
          </ScrollReveal>

          {latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
              {latestPosts.map((post, index) => {
                const snippet = getPostSnippet(post);
                const isLead = index === 0;

                return (
                  <ScrollReveal key={post.id} delay={index * 0.08} className={isLead ? "lg:col-span-2 lg:row-span-2" : ""}>
                    <Link
                      href={`/${lang}/post/${post.slug}`}
                      className={`group flex h-full overflow-hidden rounded-lg border border-outline-variant/30 bg-surface transition hover:border-secondary/50 hover:shadow-xl hover:shadow-primary/5 ${
                        isLead ? "flex-col" : "flex-col"
                      }`}
                    >
                      <div className={`relative order-2 overflow-hidden bg-surface-container md:order-1 ${isLead ? "aspect-16/9 md:aspect-16/10" : "aspect-16/9 md:aspect-16/11"}`}>
                        {post.thumbnail ? (
                          <Image
                            src={post.thumbnail}
                            alt={post.title}
                            fill
                            sizes={isLead ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 100vw, 25vw"}
                            className="object-cover transition duration-700 group-hover:scale-105"
                            priority={index < 2}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-secondary/35">menu_book</span>
                          </div>
                        )}
                      </div>

                      <div className={`${isLead ? "p-4 sm:p-5 md:p-8" : "p-4 sm:p-5"} order-1 flex flex-1 flex-col md:order-2`}>
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-secondary sm:mb-4 sm:text-[11px] sm:tracking-[0.18em]">
                          <span>{getCategoryLabel(post.category, dict.explore.categories)}</span>
                          <span className="h-px w-6 bg-outline-variant" />
                          <span className="tracking-normal text-on-surface-variant/55">
                            {formatLocalizedDate(post.createdAt, lang)}
                          </span>
                        </div>
                        <h3 className={`${isLead ? "text-2xl md:text-4xl" : "text-xl"} text-pretty font-headline font-black leading-tight text-primary transition group-hover:text-tertiary`}>
                          {post.title}
                        </h3>
                        {snippet && (
                          <p className={`${isLead ? "text-sm sm:text-base" : "text-sm"} mt-3 line-clamp-3 leading-relaxed text-on-surface-variant/75 sm:mt-4`}>
                            {snippet}
                          </p>
                        )}
                        <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-secondary sm:mt-6 sm:text-xs">
                          {dict.home.readMore}
                          <span className="material-symbols-outlined text-[17px] transition group-hover:translate-x-1">east</span>
                        </span>
                      </div>
                    </Link>
                  </ScrollReveal>
                );
              })}
            </div>
          ) : (
            <ScrollReveal>
              <div className="border-y border-dashed border-outline-variant/40 py-12 text-center sm:py-20">
                <span className="material-symbols-outlined text-4xl text-secondary/35 sm:text-5xl">inventory_2</span>
                <h3 className="mt-4 text-xl font-black tracking-tight text-primary sm:mt-5 sm:text-2xl">{dict.home.emptyTitle}</h3>
                <p className="mx-auto mt-2 max-w-sm text-on-surface-variant/65">{dict.home.emptyDescription}</p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      <section className="w-full px-4 py-10 sm:px-6 sm:py-14 md:px-12 lg:px-24 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 border-y border-outline-variant/35 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
          <ScrollReveal>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-container">
              <Image
                src="https://m0mix0w8bt.ufs.sh/f/4o6HWCjH0s2p2jj5eDVxAgZRPYzqB35sNO14E8GcidS0MeDF"
                alt="Dr. Budi Rahman Hakim (BRH)"
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
                <h2 className="font-headline text-3xl font-black leading-tight tracking-tight text-primary md:text-5xl">
                  Dr. Budi Rahman <span className="text-secondary">Hakim</span> (BRH)
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                  {dict.home.biographyCopy}
                </p>
                <Link
                  href={`/${lang}/biografi`}
                  className="mt-7 inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary transition hover:text-secondary"
                >
                  {dict.home.biographyCta}
                  <span className="material-symbols-outlined text-[18px]">east</span>
                </Link>
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
    </div>
  );
}
