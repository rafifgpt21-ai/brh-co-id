import "server-only";
import type { Locale } from "./config";
import type { dictionary as enDictionary } from "./messages/en";
import type { dictionary as idDictionary } from "./messages/id";

const dictionaries = {
  en: () => import("./messages/en").then((module) => module.dictionary),
  id: () => import("./messages/id").then((module) => module.dictionary),
};

export type Dictionary = typeof enDictionary | typeof idDictionary;

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}
