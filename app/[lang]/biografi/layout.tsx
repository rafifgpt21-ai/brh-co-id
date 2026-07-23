import type { Metadata } from "next";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createPageMetadata } from "@/lib/seo";
import {
  getProfilePageStructuredData,
  serializeStructuredData,
} from "@/lib/structured-data";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) return { title: "Biography | BRH Insight" };

  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);

  return createPageMetadata({
    title:
      lang === "id"
        ? "Biografi Budi Rahman Hakim — Akademisi, Penulis & Pembina Spiritual"
        : "Biography of Budi Rahman Hakim — Academic, Author & Spiritual Mentor",
    description: dict.biography.sidebarCopy,
    path: `/${lang}/biografi`,
    locale: lang,
    absoluteTitle: true,
  });
}

export default async function BiographyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = hasLocale(rawLang) ? rawLang : "id";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeStructuredData(getProfilePageStructuredData(lang)),
        }}
      />
      {children}
    </>
  );
}
