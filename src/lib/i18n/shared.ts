import { messages } from "./messages";

export const locales = ["fr", "en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const localeCookie = "usj_language";
export const dateLocales: Record<Locale, string> = { fr: "fr-FR", en: "en-GB", ar: "ar-LB" };
export const speechLocales: Record<Locale, string> = { fr: "fr-FR", en: "en-US", ar: "ar-LB" };
const templates = Object.keys(messages).filter(key => /\{\d+\}/u.test(key)).map(key => ({
  key,
  pattern: new RegExp("^" + key.split(/\{\d+\}/u).map(part => part.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")).join("(.+?)") + "$", "u"),
}));
export function validLocale(value: unknown): Locale {
  return value === "en" || value === "ar" ? value : "fr";
}

export function translate(locale: Locale, input: string | null | undefined, values: readonly (string | number)[] = []): string {
  const source = input ?? "";
  const key = source.trim();
  if (locale !== "fr" && !messages[key]) {
    if (source.includes("\n")) return source.split("\n").map(line => translate(locale, line)).join("\n");
    for (const template of templates) {
      const match = key.match(template.pattern);
      if (match) return translate(locale, template.key, match.slice(1).map(part => messages[part] ? translate(locale, part) : part));
    }
  }
  const translated = locale === "fr" ? key : messages[key]?.[locale] ?? key;
  const leading = source.match(/^\s*/u)?.[0] ?? "";
  const trailing = source.match(/\s*$/u)?.[0] ?? "";
  return (key ? leading + translated + trailing : source).replace(/\{(\d+)\}/gu, (match, index) => values[Number(index)] === undefined ? match : String(values[Number(index)]));
}

export function translateTitle(locale: Locale, title: string) {
  const parts = title.split(" | ");
  return parts.map(part => {
    const source = Object.keys(messages).find(key => key === part || messages[key].en === part || messages[key].ar === part) ?? part;
    return translate(locale, source);
  }).join(" | ");
}
