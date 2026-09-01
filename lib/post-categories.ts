export const LEARNING_MEDIA_CATEGORY = "Media Pembelajaran";

export const STANDARD_POST_CATEGORIES = [
  "Buku",
  "Jurnal",
  "Artikel",
  "Opini",
] as const;

export const POST_CATEGORIES = [
  ...STANDARD_POST_CATEGORIES,
  LEARNING_MEDIA_CATEGORY,
] as const;

