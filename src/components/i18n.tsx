"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { localeCookie, translate, translateTitle, validLocale, type Locale } from "@/lib/i18n/shared";

type LanguageContext = { locale: Locale; setLocale(locale: Locale): void; pending: boolean; t(source: string | null | undefined, values?: readonly (string | number)[]): string };
const Context = createContext<LanguageContext | null>(null);

export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, updateLocale] = useState(initialLocale);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const setLocale = useCallback((next: Locale) => {
    const selected = validLocale(next);
    document.cookie = `${localeCookie}=${selected}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    updateLocale(selected);
    startTransition(() => router.refresh());
  }, [router]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.title = translateTitle(locale, document.title);
  }, [locale, pathname]);
  const context = useMemo(() => ({ locale, setLocale, pending, t: (source: string | null | undefined, values?: readonly (string | number)[]) => translate(locale, source, values) }), [locale, setLocale, pending]);
  return <Context.Provider value={context}>{children}</Context.Provider>;
}

export function useI18n() {
  const context = useContext(Context);
  if (!context) throw new Error("LanguageProvider is required");
  return context;
}

export function LanguageSwitcher() {
  const id = useId();
  const { locale, setLocale, pending, t } = useI18n();
  return <div className="inline-flex shrink-0 items-center">
    <label htmlFor={id} className="sr-only">{t("Langue du site")}</label>
    <select id={id} aria-label={t("Langue du site")} value={locale} disabled={pending} onChange={event => setLocale(validLocale(event.target.value))} className="min-h-11 max-w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy">
      <option value="fr" lang="fr">Français</option><option value="en" lang="en">English</option><option value="ar" lang="ar">العربية</option>
    </select>
    <span role="status" className="sr-only">{pending ? t("Changement de langue…") : ""}</span>
  </div>;
}
