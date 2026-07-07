import { auth } from "@/auth";
import { QuickPostFeed } from "@/components/home/QuickPostFeed";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import { getQuickPosts } from "@/lib/actions/quick-post";
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
    title: `${dict.quickPost.allTitle} | BRH Intellectual Platform`,
    description: dict.quickPost.allIntro,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: dict.quickPost.allTitle,
      description: dict.quickPost.allIntro,
      url: canonicalUrl,
      siteName: "BRH Intellectual Platform",
      type: "website",
    },
  };
}

function getQuickPostFeedLabels(dict: Awaited<ReturnType<typeof getDictionary>>) {
  return {
    eyebrow: dict.quickPost.eyebrow,
    title: dict.quickPost.title,
    emptyTitle: dict.quickPost.emptyTitle,
    emptyDescription: dict.quickPost.emptyDescription,
    normal: dict.quickPost.normal,
    quote: dict.quickPost.quote,
    readMore: dict.quickPost.readMore,
    showLess: dict.quickPost.showLess,
    viewAll: dict.quickPost.viewAll,
    draftBadge: dict.quickPost.draftBadge,
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
  };
}

async function CatatanFeed({ dict, lang }: { dict: Awaited<ReturnType<typeof getDictionary>>; lang: Locale }) {
  await connection();

  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const quickPosts = await getQuickPosts({ includeDrafts: isAdmin, limit: 60 });

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
    <section id="notes" className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Loading notes">
      <div className="min-h-64 animate-pulse border-y border-outline-variant/25 py-8 lg:col-span-7" />
      <div className="min-h-48 animate-pulse border-t border-outline-variant/25 py-6 lg:col-span-5" />
      <div className="min-h-48 animate-pulse border-t border-outline-variant/25 py-6 lg:col-span-5" />
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
