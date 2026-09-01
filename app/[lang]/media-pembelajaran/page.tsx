import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArchiveCard from "@/components/katalog/ArchiveCard";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import { getPublishedPosts } from "@/lib/data/public-content";
import { hasLocale, withLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizePost } from "@/lib/i18n/posts";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) return { title: "Media Pembelajaran | BRH Insight" };

  const lang: Locale = rawLang;
  return createPageMetadata({
    title: lang === "id" ? "Media Pembelajaran | BRH Insight" : "Learning Media | BRH Insight",
    description: lang === "id"
      ? "Kumpulan media pembelajaran BRH dalam satu ruang khusus."
      : "A dedicated collection of BRH learning media.",
    path: withLocale("/media-pembelajaran", lang),
    locale: lang,
    absoluteTitle: true,
  });
}

export default async function LearningMediaPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();

  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);
  const posts = (await getPublishedPosts({ collection: "learning-media" }))
    .map((post) => localizePost(post, lang));
  const copy = lang === "id"
    ? {
        eyebrow: "RUANG BELAJAR",
        title: "Media Pembelajaran",
        intro: "Kumpulan materi pembelajaran BRH yang tersedia secara khusus melalui halaman ini.",
        count: "media tersedia",
        emptyTitle: "Belum Ada Media Pembelajaran",
        emptyDescription: "Materi pembelajaran yang telah dipublikasikan akan tampil di halaman ini.",
        back: "Kembali ke Beranda",
      }
    : {
        eyebrow: "LEARNING SPACE",
        title: "Learning Media",
        intro: "A collection of BRH learning materials available exclusively through this page.",
        count: "items available",
        emptyTitle: "No Learning Media Yet",
        emptyDescription: "Published learning materials will appear on this page.",
        back: "Back to Home",
      };

  return (
    <main className="min-h-screen bg-surface px-4 pb-24 pt-8 sm:px-6 sm:pt-12 md:px-12 lg:px-24 lg:pt-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-outline-variant/30 pb-7 sm:mb-10 sm:pb-9">
          <OptimisticLink
            href={withLocale("/", lang)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-4 text-[11px] font-black uppercase tracking-wider text-on-surface-variant transition hover:border-secondary/40 hover:bg-secondary/10 hover:text-secondary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[17px]">west</span>
            {copy.back}
          </OptimisticLink>

          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.45fr)] lg:items-end">
            <div>
              <span className="font-label text-[10px] font-black uppercase tracking-[0.28em] text-secondary sm:text-xs">{copy.eyebrow}</span>
              <h1 className="mt-3 font-headline text-4xl font-black leading-tight tracking-tight text-primary sm:text-5xl md:text-6xl">{copy.title}</h1>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant/72 sm:text-base lg:justify-self-end">{copy.intro}</p>
          </div>
        </header>

        <div className="mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px] text-secondary">school</span>
          <p className="font-label text-xs font-black uppercase tracking-widest text-on-surface-variant">
            {posts.length} {copy.count}
          </p>
        </div>

        {posts.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 lg:gap-10" aria-label={copy.title}>
            {posts.map((post) => (
              <ArchiveCard key={post.id} post={post} lang={lang} labels={dict.explore} />
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-outline-variant/35 bg-surface-container-lowest px-6 py-20 text-center sm:py-28">
            <span className="material-symbols-outlined text-5xl text-secondary/30">school</span>
            <h2 className="mt-5 font-headline text-2xl font-black tracking-tight text-primary md:text-3xl">{copy.emptyTitle}</h2>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-on-surface-variant/65">{copy.emptyDescription}</p>
          </section>
        )}
      </div>
    </main>
  );
}
