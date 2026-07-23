import type { Locale } from "@/lib/i18n/config";
import { withLocale } from "@/lib/i18n/config";
import { buildAbsoluteUrl, getPublicBaseUrl } from "@/lib/share-url";

export const PERSON_ID = `${getPublicBaseUrl()}/#person`;
export const WEBSITE_ID = `${getPublicBaseUrl()}/#website`;
export const PERSON_IMAGE_PATH = "/budi-rahman-hakim.jpg";

const officialProfiles = [
  "https://staff.uinjkt.ac.id/profile.php?staff=8329a42e-7de6-2437-b005-8070ab79b99c",
  "https://sinta.kemdiktisaintek.go.id/authors/profile/6950877/",
];

export function getPersonNode() {
  const imageUrl = buildAbsoluteUrl(PERSON_IMAGE_PATH);

  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Budi Rahman Hakim",
    alternateName: "BRH",
    honorificPrefix: "Assoc. Prof.",
    honorificSuffix: "S.Ag., M.S.W., Ph.D.",
    url: buildAbsoluteUrl("/"),
    image: {
      "@type": "ImageObject",
      url: imageUrl,
      contentUrl: imageUrl,
      width: 332,
      height: 357,
      caption: "Assoc. Prof. Budi Rahman Hakim, S.Ag., M.S.W., Ph.D.",
    },
    jobTitle: ["Akademisi", "Penulis", "Jurnalis Senior", "Pembina Spiritual"],
    affiliation: {
      "@type": "CollegeOrUniversity",
      name: "UIN Syarif Hidayatullah Jakarta",
      url: "https://www.uinjkt.ac.id/",
    },
    sameAs: officialProfiles,
  };
}

export function getWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: buildAbsoluteUrl("/"),
        name: "Budi Rahman Hakim",
        alternateName: "BRH",
        inLanguage: ["id-ID", "en-US"],
        author: { "@id": PERSON_ID },
      },
      getPersonNode(),
    ],
  };
}

export function getProfilePageStructuredData(locale: Locale) {
  const profileUrl = buildAbsoluteUrl(withLocale("/biografi", locale));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${profileUrl}#profilepage`,
        url: profileUrl,
        name:
          locale === "id"
            ? "Biografi Budi Rahman Hakim"
            : "Biography of Budi Rahman Hakim",
        inLanguage: locale === "id" ? "id-ID" : "en-US",
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: { "@id": PERSON_ID },
      },
      getPersonNode(),
    ],
  };
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
