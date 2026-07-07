import type { Metadata } from "next";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) return { title: "Biography | BRH Insight" };

  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);

  return createPageMetadata({
    title: `${dict.nav.biography} | BRH Insight`,
    description: dict.biography.sidebarCopy,
    path: `/${lang}/biografi`,
    locale: lang,
  });
}

export default function BiographyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
