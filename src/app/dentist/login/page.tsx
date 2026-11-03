import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DentistLoginForm } from "@/components/dentist/login-form";
import { dentistForSession } from "@/lib/dentist/auth";
import { currentDentistToken } from "@/lib/dentist/session";
import { Icon } from "@/components/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Connexion dentiste"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

export default async function DentistLoginPage() {
  const { t } = await getI18n();
  if (await dentistForSession(await currentDentistToken())) redirect("/dentist");
  return <div className="mx-auto w-full max-w-lg px-5 py-5 sm:py-12">
    <Link href="/" className="text-link"><Icon name="back" className="size-4" />{t("Accueil USJ TeleDent")}</Link>
    <section className="surface mt-5 p-6 sm:p-9">
      <span className="icon-tile mb-6"><Icon name="grid" /></span>
      <p className="eyebrow">{t("Espace dentiste")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t("Heureux de vous retrouver")}</h1>
      <p className="mt-4 text-sm leading-6 text-slate-600">{t("Connectez-vous pour consulter les demandes de votre service.")}</p>
      <DentistLoginForm />
    </section>
    <p className="mt-5 text-sm leading-6 text-slate-500">{t("Accès réservé aux dentistes. Prototype local : comptes et données fictifs uniquement.")}</p>
  </div>;
}
