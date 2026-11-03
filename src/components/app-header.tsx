"use client";
import { LanguageSwitcher, useI18n } from "@/components/i18n";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./brand";

export function AppHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  if (pathname.startsWith("/dentist") && pathname !== "/dentist/login") return null;
  const isPatient = pathname.startsWith("/patient");
  return <header className="app-header">
    <div className="page-container flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
      <Brand />
      <nav aria-label={t("Navigation principale")} className="flex items-center gap-2 sm:gap-4">
        {!isPatient && <Link href={pathname === "/dentist/login" ? "/patient" : "/dentist"} className="header-link hidden sm:inline-flex">{pathname === "/dentist/login" ? t("Espace patient") : t("Espace dentiste")}</Link>}
        <LanguageSwitcher />
      </nav>
    </div>
  </header>;
}
