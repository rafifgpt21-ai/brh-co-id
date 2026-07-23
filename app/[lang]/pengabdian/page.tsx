import { auth } from "@/auth";
import { QuickPostFeed } from "@/components/home/QuickPostFeed";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import { getQuickPostsByType } from "@/lib/actions/quick-post";
import { createPageMetadata } from "@/lib/seo";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale, withLocale, type Locale } from "@/lib/i18n/config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

type PageParams = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) return {};
  return createPageMetadata({
    title: rawLang === "id"
      ? "Pengajaran & Pengabdian | BRH"
      : "Teaching & Engagement | BRH",
    description: rawLang === "id"
      ? "Arsip agenda pengajaran dan kegiatan pengabdian Budi Rahman Hakim."
      : "Teaching and engagement agenda archive by Budi Rahman Hakim.",
    path: withLocale("/pengabdian", rawLang),
    locale: rawLang,
    absoluteTitle: true,
  });
}

function getFeedLabels(dict: Awaited<ReturnType<typeof getDictionary>>) {
  return {
    ...dict.quickPost,
    addImage: dict.quickPost.addImage,
    changeImage: dict.quickPost.changeImage,
    removeImage: dict.quickPost.removeImage,
  };
}

export default async function EngagementPage({ params }: { params: PageParams }) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  await connection();

  const lang: Locale = rawLang;
  const [dict, session, quickPosts] = await Promise.all([
    getDictionary(lang),
    auth(),
    getQuickPostsByType({ includeDrafts: true, limitPerType: 60 }),
  ]);
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const baseColumns = { ...quickPosts, QUOTE: [] };
  const teaching = {
    ...baseColumns,
    AGENDA: quickPosts.AGENDA.filter((item) => item.agendaCategory === "TEACHING"),
  };
  const engagement = {
    ...baseColumns,
    AGENDA: quickPosts.AGENDA.filter((item) => item.agendaCategory === "ENGAGEMENT"),
  };
  const copy = lang === "id"
    ? {
        title: "Pengajaran & Pengabdian",
        intro: "Arsip agenda Pengajaran dan Pengabdian, mencakup kegiatan mendatang dan kegiatan yang telah selesai.",
        teaching: "Agenda Pengajaran",
        teachingIntro: "Jadwal kegiatan akademik dan pembelajaran.",
        engagement: "Agenda Pengabdian",
        engagementIntro: "Jadwal kajian, kegiatan publik, dan pengabdian.",
        back: "Kembali ke Beranda",
      }
    : {
        title: "Teaching & Engagement",
        intro: "An archive of Teaching and Engagement agendas, including upcoming and completed activities.",
        teaching: "Teaching Agenda",
        teachingIntro: "Academic and learning activity schedules.",
        engagement: "Engagement Agenda",
        engagementIntro: "Public studies, public activities, and engagement schedules.",
        back: "Back to Home",
      };
  const labels = getFeedLabels(dict);

  return (
    <main className="min-h-screen bg-surface px-4 pb-24 pt-8 sm:px-6 sm:pt-12 md:px-12 lg:px-24 lg:pt-16">
      <div className="mx-auto max-w-7xl">
        <OptimisticLink href={withLocale("/", lang)} className="inline-flex h-10 items-center gap-2 rounded-full border border-outline-variant/30 px-4 text-[11px] font-black uppercase tracking-wider text-on-surface-variant hover:text-primary">
          <span className="material-symbols-outlined text-[17px]">west</span>
          {copy.back}
        </OptimisticLink>
        <header className="mt-8 border-b border-outline-variant/30 pb-10">
          <h1 className="max-w-5xl font-headline text-4xl font-black leading-tight tracking-tight text-primary sm:text-5xl md:text-7xl">{copy.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-on-surface-variant/72 md:text-lg">{copy.intro}</p>
        </header>

        <div className="grid gap-12 py-12 lg:grid-cols-2 lg:gap-8 lg:py-16">
          <section>
            <div className="mb-7 border-b border-outline-variant/30 pb-6">
              <span className="font-label text-[10px] font-black uppercase tracking-[0.2em] text-secondary">01</span>
              <h2 className="mt-2 font-headline text-3xl font-black text-primary md:text-4xl">{copy.teaching}</h2>
              <p className="mt-3 text-on-surface-variant/70">{copy.teachingIntro}</p>
            </div>
            <QuickPostFeed quickPosts={teaching} isAdmin={isAdmin} lang={lang} labels={{ ...labels, agenda: copy.teaching }} visibleTypes={["AGENDA"]} variant="full" />
          </section>

          <section>
            <div className="mb-7 border-b border-outline-variant/30 pb-6">
              <span className="font-label text-[10px] font-black uppercase tracking-[0.2em] text-secondary">02</span>
              <h2 className="mt-2 font-headline text-3xl font-black text-primary md:text-4xl">{copy.engagement}</h2>
              <p className="mt-3 text-on-surface-variant/70">{copy.engagementIntro}</p>
            </div>
            <QuickPostFeed quickPosts={engagement} isAdmin={isAdmin} lang={lang} labels={{ ...labels, agenda: copy.engagement }} visibleTypes={["AGENDA"]} variant="full" />
          </section>
        </div>
      </div>
    </main>
  );
}
