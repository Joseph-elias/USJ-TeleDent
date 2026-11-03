import { dateLocales } from "@/lib/i18n/shared";
import { reasons } from "@/components/patient/patient-data";
import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon, StatusBadge } from "@/components/ui";
import { notFound, redirect } from "next/navigation";
import { DentistShell } from "@/components/dentist/shell";
import { DentistPhotoGallery } from "@/components/dentist/photo-gallery";
import { DentistEvaluationForm } from "@/components/dentist/evaluation-form";
import { loadDentistRequest } from "@/lib/dentist/request-details";
import { currentDentistToken } from "@/lib/dentist/session";
import { statusLabels } from "@/lib/dentist/filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Détail de la demande"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}


const card = "surface mt-5 p-5 sm:p-7";

async function Information({ label, value }: { label: string; value: string | null | undefined }) {
  const { t } = await getI18n();
  return <div className="min-w-0"><dt className="text-sm text-slate-500">{t(label)}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6"><bdi dir={["Téléphone", "Email", "Référence", "Numéro de dossier USJ"].includes(label) ? "ltr" : "auto"}>{value?.trim() || t("Non renseigné")}</bdi></dd></div>;
}

export default async function DentistRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, locale } = await getI18n();
  const submittedDate = new Intl.DateTimeFormat(dateLocales[locale], { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Beirut" });
  const result = await loadDentistRequest(await currentDentistToken(), (await params).id);
  if (result.status === "unauthenticated") redirect("/dentist/login");
  if (result.status === "not_found") notFound();
  const { dentist, request } = result;
  return <DentistShell dentist={dentist} dashboardActive={false}>
    <Link href="/dentist" prefetch={false} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-light-blue">{t("← Retour au tableau de bord")}</Link>
    <p className="eyebrow mt-7">{t(request.department)}</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t("Détail de la demande")}</h1>
    <p className="mt-3 break-all text-sm font-semibold text-slate-600"><bdi dir="ltr">{request.request_reference}</bdi></p>
    <div className="mt-4 flex flex-wrap gap-2"><StatusBadge status={request.status}>{t(statusLabels[request.status] ?? request.status)}</StatusBadge><StatusBadge status={request.priority}>{request.priority === "high" ? t("Priorité haute") : t("Priorité normale")}</StatusBadge></div>
    <nav aria-label={t("Sections du dossier")} className="mt-5 flex gap-2 overflow-x-auto pb-2">{[["patient-information", "Patient"], ["symptom-information", "Symptômes"], ["attached-photos", "Photos"], ["dentist-evaluation", "Évaluation"]].map(([id, label]) => <a key={id} href={`#${id}`} className="button button-secondary shrink-0 px-3 text-xs">{t(label)}{id === "dentist-evaluation" && <Icon name="arrow" className="size-3.5" />}</a>)}</nav>
    <p className="mt-5 rounded-xl bg-light-blue p-4 text-sm leading-6">{t("Consultez les informations et les photos, puis complétez l’évaluation ci-dessous. Les informations fournies par le patient restent inchangées.")}</p>

    <section aria-labelledby="patient-information" className={card}>
      <h2 id="patient-information" className="text-xl font-semibold">{t("Informations patient")}</h2>
      <dl className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <Information label="Nom et prénom" value={request.patient_name} />
        <Information label="Numéro de dossier USJ" value={request.patient_file_number} />
        <Information label="Date de naissance" value={request.date_of_birth?.split("-").reverse().join("/")} />
        <Information label="Téléphone" value={request.phone} />
        {request.email && <Information label="Email" value={request.email} />}
      </dl>
    </section>
    <section aria-labelledby="request-information" className={card}>
      <h2 id="request-information" className="text-xl font-semibold">{t("Informations de la demande")}</h2>
      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        <Information label="Référence" value={request.request_reference} />
        <Information label="Date d’envoi (heure de Beyrouth)" value={submittedDate.format(new Date(request.created_at))} />
        <Information label="Service affecté" value={t(request.department)} />
        <Information label="Motif de contact" value={t(request.reason_label)} />
        <Information label="Statut actuel" value={t(statusLabels[request.status] ?? request.status)} />
        <Information label="Priorité actuelle" value={t(request.priority === "high" ? "Haute" : request.priority === "normal" ? "Normale" : request.priority)} />
      </dl>
    </section>
    <section aria-labelledby="symptom-information" className={card}>
      <h2 id="symptom-information" className="text-xl font-semibold">{t("Symptômes et réponses")}</h2>
      <dl className="mt-6 space-y-5">
        <Information label="Description du patient" value={request.description} />
        {request.symptoms.map((question) => <Information key={question.id} label={question.label} value={reasons.find(reason => reason.label === request.reason_label)?.questions.find(item => item.id === question.id)?.options?.includes(question.answer ?? "") ? t(question.answer) : question.answer} />)}
      </dl>
      {!request.symptoms.length && <p className="mt-5 text-sm text-slate-600">{t("Aucune question de symptômes disponible pour ce motif.")}</p>}
    </section>
    <section aria-labelledby="attached-photos" className={card}>
      <h2 id="attached-photos" className="text-xl font-semibold">{t("Photos jointes")}</h2>
      <DentistPhotoGallery requestId={request.id} photos={request.photos} />
    </section>
    <section aria-labelledby="dentist-evaluation" className={card}>
      <h2 id="dentist-evaluation" className="text-xl font-semibold">{t("Évaluation du dentiste")}</h2>
      <DentistEvaluationForm requestId={request.id} initial={{
        priority: request.priority, status: request.status, department: request.department,
        dentist_decision: request.dentist_decision, dentist_response: request.dentist_response,
        proposed_appointment_at: request.proposed_appointment_at, call_video_details: request.call_video_details,
        updated_at: request.updated_at,
      }} />
    </section>
    <p className="mt-6 text-xs leading-6 text-slate-500">{t("Données confidentielles du service · Prototype local, données fictives uniquement.")}</p>
  </DentistShell>;
}
