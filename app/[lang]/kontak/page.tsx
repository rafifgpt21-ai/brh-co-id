import { ContactForm } from "@/components/contact/ContactForm";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import { hasLocale, withLocale, type Locale } from "@/lib/i18n/config";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageParams = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return createPageMetadata({
    title: lang === "id" ? "Kontak Budi Rahman Hakim | BRH" : "Contact Budi Rahman Hakim | BRH",
    description: lang === "id"
      ? "Hubungi Budi Rahman Hakim untuk korespondensi akademik, kolaborasi riset, pengajaran, dan kegiatan publik."
      : "Contact Budi Rahman Hakim for academic correspondence, research collaboration, teaching, and public engagement.",
    path: withLocale("/kontak", lang),
    locale: lang,
    absoluteTitle: true,
  });
}

export default async function ContactPage({ params }: { params: PageParams }) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const copy = lang === "id"
    ? {
        back: "Kembali ke Beranda",
        eyebrow: "KONTAK",
        title: "Mari Memulai Percakapan",
        intro: "Untuk korespondensi akademik, kolaborasi riset, pengajaran, undangan kajian, dan kegiatan publik, silakan gunakan formulir atau email di bawah.",
        direct: "Kontak Langsung",
        email: "Email Akademik",
        affiliation: "Afiliasi",
        affiliationValue: "UIN Syarif Hidayatullah Jakarta",
        location: "Lokasi",
        locationValue: "Jakarta, Indonesia",
      }
    : {
        back: "Back to Home",
        eyebrow: "CONTACT",
        title: "Let’s Start a Conversation",
        intro: "For academic correspondence, research collaboration, teaching, public study invitations, and engagement, use the form or email below.",
        direct: "Direct Contact",
        email: "Academic Email",
        affiliation: "Affiliation",
        affiliationValue: "UIN Syarif Hidayatullah Jakarta",
        location: "Location",
        locationValue: "Jakarta, Indonesia",
      };

  return (
    <main className="min-h-screen bg-surface px-4 pb-24 pt-8 sm:px-6 sm:pt-12 md:px-12 lg:px-24 lg:pt-16">
      <div className="mx-auto max-w-7xl">
        <OptimisticLink href={withLocale("/", lang)} className="inline-flex h-10 items-center gap-2 rounded-full border border-outline-variant/30 px-4 text-[11px] font-black uppercase tracking-wider text-on-surface-variant hover:text-primary">
          <span className="material-symbols-outlined text-[17px]">west</span>
          {copy.back}
        </OptimisticLink>

        <header className="mt-8 max-w-5xl">
          <span className="font-label text-[10px] font-black uppercase tracking-[0.28em] text-secondary sm:text-xs">{copy.eyebrow}</span>
          <h1 className="mt-3 font-headline text-4xl font-black leading-tight tracking-tight text-primary sm:text-5xl md:text-7xl">{copy.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-on-surface-variant/72 md:text-lg">{copy.intro}</p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(280px,0.42fr)_minmax(0,0.8fr)] lg:items-start">
          <aside className="rounded-2xl bg-tertiary p-6 text-background sm:p-8">
            <h2 className="font-headline text-2xl font-black">{copy.direct}</h2>
            <dl className="mt-8 space-y-7">
              <div>
                <dt className="font-label text-[10px] font-black uppercase tracking-[0.2em] text-secondary-fixed">{copy.email}</dt>
                <dd className="mt-2"><a href="mailto:budi.rahman@uinjkt.ac.id" className="break-all text-sm font-bold hover:text-secondary-fixed">budi.rahman@uinjkt.ac.id</a></dd>
              </div>
              <div>
                <dt className="font-label text-[10px] font-black uppercase tracking-[0.2em] text-secondary-fixed">{copy.affiliation}</dt>
                <dd className="mt-2 text-sm font-bold leading-relaxed">{copy.affiliationValue}</dd>
              </div>
              <div>
                <dt className="font-label text-[10px] font-black uppercase tracking-[0.2em] text-secondary-fixed">{copy.location}</dt>
                <dd className="mt-2 text-sm font-bold">{copy.locationValue}</dd>
              </div>
            </dl>
          </aside>
          <ContactForm lang={lang} />
        </div>
      </div>
    </main>
  );
}
