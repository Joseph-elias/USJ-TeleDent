import Link from "next/link";

export default function TrackingNotFound() {
  return <div className="mx-auto max-w-2xl px-6 py-16">
    <h1 className="text-3xl font-semibold">Demande introuvable</h1>
    <p className="mt-4 text-slate-600">Ce lien ne permet pas de consulter une demande. Vérifiez le lien privé reçu lors de l’enregistrement.</p>
    <Link href="/patient" className="mt-6 inline-block font-semibold underline">Retour à l’espace patient</Link>
  </div>;
}
