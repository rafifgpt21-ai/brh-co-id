import type { Metadata } from "next";
import { buildAbsoluteUrl } from "@/lib/share-url";
import { locales, type Locale } from "@/lib/i18n/config";

const SITE_NAME = "BRH Insight";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  image?: string | null;
};

export function createPageMetadata({
  title,
  description,
  path,
  locale,
  image,
}: PageMetadataOptions): Metadata {
  const canonical = buildAbsoluteUrl(path);
  const localizedPath = path.replace(/^\/(en|id)(?=\/|$)/, "");
  const languages = Object.fromEntries(
    locales.map((item) => [
      item,
      buildAbsoluteUrl(localizedPath === "" ? `/${item}` : `/${item}${localizedPath}`),
    ]),
  );

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      locale: locale === "id" ? "id_ID" : "en_US",
      images: image ? [{ url: image, alt: title }] : [{ url: buildAbsoluteUrl("/opengraph-image"), alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [buildAbsoluteUrl("/opengraph-image")],
    },
  };
}
