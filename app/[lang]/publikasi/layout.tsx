import type { Metadata } from "next";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) return { title: "Publications | BRH Insight" };

  const lang: Locale = rawLang;

  return createPageMetadata({
    title:
      lang === "id"
        ? "Publikasi Budi Rahman Hakim | BRH"
        : "Publications by Budi Rahman Hakim | BRH",
    description:
      lang === "id"
        ? "Buku, artikel jurnal, dan kajian akademik BRH yang menghubungkan spiritualitas Islam dengan persoalan sosial, pendidikan, kesejahteraan, dan pembangunan peradaban."
        : "BRH books, journal articles, and academic studies connecting Islamic spirituality with social issues, education, welfare, and civilizational development.",
    path: `/${lang}/publikasi`,
    locale: lang,
    absoluteTitle: true,
  });
}

export default function PublicationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
