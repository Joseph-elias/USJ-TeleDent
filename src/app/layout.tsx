import { getI18n } from "@/lib/i18n/server";
import type { Metadata, Viewport } from "next";
import { AppHeader } from "@/components/app-header";
import { LanguageProvider } from "@/components/i18n";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: `USJ TeleDent | ${t("Votre santé dentaire, en lien")}`, template: "%s | USJ TeleDent" },
    description: t("Un espace pour transmettre votre demande dentaire et échanger avec les professionnels de l’USJ."),
  };
}

export const viewport: Viewport = { themeColor: "#102f50", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { t, locale } = await getI18n();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body className="flex min-h-dvh flex-col bg-background text-navy antialiased">
        <LanguageProvider initialLocale={locale}>
        <a href="#main-content" className="skip-link">{t("Aller au contenu")}</a>
        <AppHeader />
        <main id="main-content" tabIndex={-1} className="flex min-w-0 flex-1 flex-col">{children}</main>
        <footer className="border-t border-slate-200/70 bg-white pb-[env(safe-area-inset-bottom)]">
          <div className="page-container flex flex-col gap-1 py-5 text-xs leading-6 text-slate-500 sm:flex-row sm:justify-between">
            <p><span className="font-semibold text-navy">{t("USJ TeleDent")}</span> {t(" · Patients et professionnels, en lien")}</p>
            <p>{t("Prototype local · Données fictives uniquement")}</p>
          </div>
        </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
