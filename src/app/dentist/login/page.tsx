import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DentistLoginForm } from "@/components/dentist/login-form";
import { dentistForSession } from "@/lib/dentist/auth";
import { currentDentistToken } from "@/lib/dentist/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connexion dentiste", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function DentistLoginPage() {
  if (await dentistForSession(await currentDentistToken())) redirect("/dentist");
  return <div className="mx-auto w-full max-w-lg px-5 py-10 sm:py-16">
    <Link href="/" className="text-sm font-semibold underline underline-offset-4">← Accueil USJ TeleDent</Link>
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-9">
      <p className="eyebrow">Espace dentiste</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Bienvenue dans votre espace</h1>
      <p className="mt-4 text-sm leading-6 text-slate-600">Connectez-vous pour consulter les demandes de votre service.</p>
      <DentistLoginForm />
    </section>
    <p className="mt-5 text-sm leading-6 text-slate-500">Accès réservé aux dentistes. Prototype local : comptes et données fictifs uniquement.</p>
  </div>;
}
