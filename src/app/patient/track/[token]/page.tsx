import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrackingRequest } from "@/lib/requests/storage";
import { reasons } from "@/components/patient/patient-data";
import { decisionLabels, statusLabels } from "@/lib/requests/evaluation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Suivi privé de votre demande",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

function date(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Beirut" }).format(new Date(value));
}

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const request = await getTrackingRequest(token);
  if (!request) notFound();
  return <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
    <Link href="/patient" className="text-sm font-semibold underline underline-offset-4">← Espace patient</Link>
    <p className="eyebrow mt-8">Suivi privé</p>
    <h1 className="mt-3 text-3xl font-semibold">Votre demande</h1>
    <p className="mt-4 rounded-xl bg-light-blue p-4 text-sm leading-6">Conservez ce lien privé. Toute personne qui le possède peut consulter ce suivi et ses photos. Ne le partagez pas publiquement.</p>
    <section aria-label="Informations de suivi" className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <dl className="space-y-5 text-sm">
        <div><dt className="text-slate-500">Référence de la demande</dt><dd className="mt-1 break-all font-semibold">{request.request_reference}</dd></div>
        <div><dt className="text-slate-500">Date d’enregistrement (heure de Beyrouth)</dt><dd className="mt-1">{date(request.created_at)}</dd></div>
        <div><dt className="text-slate-500">Service sélectionné</dt><dd className="mt-1">{request.department}</dd></div>
        <div><dt className="text-slate-500">Motif de contact</dt><dd className="mt-1">{reasons.find((reason) => reason.id === request.reason)?.label ?? request.reason}</dd></div>
        <div><dt className="text-slate-500">Statut actuel</dt><dd className="mt-2 inline-block rounded-full bg-light-blue px-4 py-2 font-semibold">{statusLabels[request.status] ?? request.status}</dd></div>
      </dl>
      <div className="mt-7 border-t border-slate-200 pt-5">
        <h2 className="font-semibold">Réponse du dentiste</h2>
        {request.dentist_decision && <p className="mt-3 text-sm font-semibold">Décision : {decisionLabels[request.dentist_decision] ?? "Non renseignée"}</p>}
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{request.dentist_response || "Aucune réponse disponible pour le moment."}</p>
        {request.dentist_decision === "appointment" && request.proposed_appointment_at && <div className="mt-4 rounded-xl bg-light-blue p-4 text-sm leading-6"><p>Rendez-vous proposé (heure de Beyrouth) : {date(request.proposed_appointment_at)}</p><p className="mt-2">Cette proposition ne constitue pas une réservation automatique.</p></div>}
        {(request.dentist_decision === "call" || request.dentist_decision === "video") && request.call_video_details && <div className="mt-4 text-sm leading-6"><p className="font-semibold">{request.dentist_decision === "video" ? "Instructions de téléconsultation vidéo" : "Instructions d’appel"}</p><p className="mt-2 whitespace-pre-wrap break-words">{request.call_video_details}</p></div>}
      </div>
      {request.photos.length > 0 && <section aria-label="Photos jointes" className="mt-7 border-t border-slate-200 pt-5">
        <h2 className="font-semibold">Photos jointes</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">{request.photos.map((photo, index) => (
          // Protected images must bypass Next Image's public optimization cache.
          // eslint-disable-next-line @next/next/no-img-element
          <img key={photo.id} src={`/api/requests/track/${token}/photos/${photo.id}`} referrerPolicy="no-referrer" alt={`Photo jointe ${index + 1}`} className="h-48 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain" />
        ))}</div>
      </section>}
    </section>
    <p className="mt-6 text-sm leading-6 text-slate-600">Prototype local : utilisez uniquement des informations fictives. En cas d’urgence grave, consultez immédiatement les urgences sans attendre une réponse en ligne.</p>
  </div>;
}
