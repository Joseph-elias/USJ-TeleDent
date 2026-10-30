import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DentistShell } from "@/components/dentist/shell";
import { DentistPhotoGallery } from "@/components/dentist/photo-gallery";
import { loadDentistRequest } from "@/lib/dentist/request-details";
import { currentDentistToken } from "@/lib/dentist/session";
import { statusLabels } from "@/lib/dentist/filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Détail de la demande", robots: { index: false, follow: false }, referrer: "no-referrer" };

const submittedDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Beirut" });
const card = "mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7";

function Information({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="min-w-0"><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6">{value?.trim() || "Non renseigné"}</dd></div>;
}

export default async function DentistRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const result = await loadDentistRequest(await currentDentistToken(), (await params).id);
  if (result.status === "unauthenticated") redirect("/dentist/login");
  if (result.status === "not_found") notFound();
  const { dentist, request } = result;
  return <DentistShell dentist={dentist} dashboardActive={false}>
    <Link href="/dentist" prefetch={false} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-light-blue">← Retour au tableau de bord</Link>
    <p className="eyebrow mt-7">{request.department}</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight">Détail de la demande</h1>
    <p className="mt-3 break-all text-sm font-semibold text-slate-600">{request.request_reference}</p>
    <p className="mt-5 rounded-xl bg-light-blue p-4 text-sm leading-6">Consultation en lecture seule. Aucune modification de la demande n’est disponible à cette étape.</p>

    <section aria-labelledby="patient-information" className={card}>
      <h2 id="patient-information" className="text-xl font-semibold">Informations patient</h2>
      <dl className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <Information label="Nom et prénom" value={request.patient_name} />
        <Information label="Numéro de dossier USJ" value={request.patient_file_number} />
        <Information label="Date de naissance" value={request.date_of_birth?.split("-").reverse().join("/")} />
        <Information label="Téléphone" value={request.phone} />
        {request.email && <Information label="Email" value={request.email} />}
      </dl>
    </section>
    <section aria-labelledby="request-information" className={card}>
      <h2 id="request-information" className="text-xl font-semibold">Informations de la demande</h2>
      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        <Information label="Référence" value={request.request_reference} />
        <Information label="Date d’envoi (heure de Beyrouth)" value={submittedDate.format(new Date(request.created_at))} />
        <Information label="Service affecté" value={request.department} />
        <Information label="Motif de contact" value={request.reason_label} />
        <Information label="Statut actuel" value={statusLabels[request.status] ?? request.status} />
        <Information label="Priorité actuelle" value={request.priority === "high" ? "Haute" : request.priority === "normal" ? "Normale" : request.priority} />
      </dl>
    </section>
    <section aria-labelledby="symptom-information" className={card}>
      <h2 id="symptom-information" className="text-xl font-semibold">Symptômes et réponses</h2>
      <dl className="mt-6 space-y-5">
        <Information label="Description du patient" value={request.description} />
        {request.symptoms.map((question) => <Information key={question.id} label={question.label} value={question.answer} />)}
      </dl>
      {!request.symptoms.length && <p className="mt-5 text-sm text-slate-600">Aucune question de symptômes disponible pour ce motif.</p>}
    </section>
    <section aria-labelledby="attached-photos" className={card}>
      <h2 id="attached-photos" className="text-xl font-semibold">Photos jointes</h2>
      <DentistPhotoGallery requestId={request.id} photos={request.photos} />
    </section>
    <p className="mt-6 text-xs leading-6 text-slate-500">Données confidentielles du service · Prototype local, données fictives uniquement.</p>
  </DentistShell>;
}
