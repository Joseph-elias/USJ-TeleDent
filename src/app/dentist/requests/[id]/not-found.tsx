import Link from "next/link";

export default function DentistRequestNotFound() {
  return <div className="mx-auto w-full max-w-2xl px-6 py-16">
    <h1 className="text-3xl font-semibold">Demande introuvable</h1>
    <p className="mt-4 text-sm leading-6 text-slate-600">Cette demande n’est pas disponible dans votre espace.</p>
    <Link href="/dentist" prefetch={false} className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white">Retour au tableau de bord</Link>
  </div>;
}
