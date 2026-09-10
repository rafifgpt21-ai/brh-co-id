export const LEARNING_MEDIA_CATEGORY = "Media Pembelajaran";
export const SCIENTIFIC_PUBLICATION_CATEGORY = "Publikasi Ilmiah";
export const LEGACY_JOURNAL_CATEGORY = "Jurnal";

export const SCIENTIFIC_PUBLICATION_CATEGORY_VALUES = [
  SCIENTIFIC_PUBLICATION_CATEGORY,
  LEGACY_JOURNAL_CATEGORY,
] as const;

export function isScientificPublicationCategory(category?: string | null) {
  return category === SCIENTIFIC_PUBLICATION_CATEGORY || category === LEGACY_JOURNAL_CATEGORY;
}

export function normalizePostCategory(category: string) {
  return category === LEGACY_JOURNAL_CATEGORY ? SCIENTIFIC_PUBLICATION_CATEGORY : category;
}

export const STANDARD_POST_CATEGORIES = [
  "Buku",
  SCIENTIFIC_PUBLICATION_CATEGORY,
  "Artikel",
  "Opini",
] as const;

export const POST_CATEGORIES = [
  ...STANDARD_POST_CATEGORIES,
  LEARNING_MEDIA_CATEGORY,
] as const;
