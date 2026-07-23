import type { Metadata } from "next";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) return { title: "Research | BRH Insight" };

  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);

  return createPageMetadata({
    title:
      lang === "id"
        ? "Riset Budi Rahman Hakim | BRH"
        : "Research by Budi Rahman Hakim | BRH",
    description: dict.research.intro,
    path: `/${lang}/riset`,
    locale: lang,
    absoluteTitle: true,
  });
}

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
