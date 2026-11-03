import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { LanguageSwitcher } from "@/components/i18n";
import { Icon } from "@/components/ui";
import type { Dentist } from "@/lib/dentist/auth";

export async function DentistShell({ dentist, children, dashboardActive = true }: {
  dentist: Dentist;
  children: React.ReactNode;
  dashboardActive?: boolean;
}) {
  const { t } = await getI18n();
  return <div className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col lg:flex-row">
    <header className="dentist-mobile-header border-b border-slate-200 bg-white pb-3 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Brand />
        <details className="relative">
          <summary className="flex min-h-11 list-none items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"><Icon name="user" className="size-4" />{t("Compte")}</summary>
          <div className="absolute end-0 top-full z-30 mt-2 w-64 max-w-[calc(100vw-2.5rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <p className="text-sm font-semibold">{dentist.full_name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{t(dentist.department)}</p>
            <form method="post" action="/api/dentist/logout" className="mt-4"><button type="submit" className="button button-secondary w-full"><Icon name="logout" className="size-4" />{t("Se déconnecter")}</button></form>
          </div>
        </details>
      </div>
      <nav aria-label={t("Navigation dentiste mobile")} className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <Link href="/dentist" prefetch={false} aria-current={dashboardActive ? "page" : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-light-blue px-3 font-semibold"><Icon name="grid" className="size-4" />{t("Tableau de bord")}</Link>
        {!dashboardActive && <span className="text-slate-500">{t("/ Dossier patient")}</span>}
        <LanguageSwitcher />
      </nav>
    </header>
    <aside aria-label={t("Espace dentiste")} className="hidden w-60 shrink-0 flex-col border-e border-slate-200 bg-white p-5 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:self-start lg:overflow-y-auto xl:w-64">
      <div className="mb-10 pt-2"><Brand /></div>
      <p className="eyebrow px-3">{t("Espace professionnel")}</p>
      <nav aria-label={t("Navigation dentiste")} className="mt-4">
        <Link href="/dentist" prefetch={false} aria-current={dashboardActive ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${dashboardActive ? "bg-navy text-white" : "bg-light-blue text-navy"}`}><Icon name="grid" className="size-4" />{t("Tableau de bord")}</Link>
      </nav>
      <div className="mt-7 rounded-xl bg-background p-4"><span className="icon-tile mb-3 bg-white"><Icon name="shield" /></span><p className="text-xs font-semibold">{t("Votre espace de travail")}</p><p className="mt-2 text-xs leading-6 text-slate-500">{t("Les dossiers affichés sont ceux de votre service.")}</p></div>
      <div className="mt-auto border-t border-slate-200 pt-6">
        <p className="text-sm font-semibold">{dentist.full_name}</p>
        <p className="mt-2 text-xs leading-6 text-slate-500">{t(dentist.department)}</p>
        <form method="post" action="/api/dentist/logout" className="mt-4"><button type="submit" className="button button-secondary w-full px-3 text-xs"><Icon name="logout" className="size-4" />{t("Se déconnecter")}</button></form>
      </div>
    </aside>
    <div className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:px-10 lg:py-10"><div className="mb-5 hidden justify-end lg:flex"><LanguageSwitcher /></div>{children}</div>
  </div>;
}
