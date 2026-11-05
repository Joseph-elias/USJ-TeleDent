import { dateLocales, type Locale } from "@/lib/i18n/shared";
import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrackingRequest } from "@/lib/requests/storage";
import { reasons } from "@/components/patient/patient-data";
import { Icon, StatusBadge } from "@/components/ui";
import { TrackingRefresh } from "@/components/patient/tracking-refresh";
import { decisionLabels, statusLabels } from "@/lib/requests/evaluation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
  title: t("Suivi privé de votre demande"),
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};
}

function date(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(dateLocales[locale], { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Beirut" }).format(new Date(value));
}

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { t, locale } = await getI18n();
  const { token } = await params;
  const request = await getTrackingRequest(token);
  if (!request) notFound();
  return <div className="mx-auto w-full max-w-3xl px-5 py-5 sm:px-8 sm:py-8">
    <Link href="/patient" className="text-link"><Icon name="back" className="size-4" />{t("Espace patient")}</Link>
    <p className="eyebrow mt-5">{t("Suivi privé")}</p>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-semibold tracking-tight">{t("Votre demande")}</h1><StatusBadge status={request.status}>{t(statusLabels[request.status] ?? request.status)}</StatusBadge></div>
    <p className="mt-3 text-sm leading-6 text-slate-500">{t("Retrouvez ici la réponse de votre service et les prochaines étapes proposées.")}</p>
    <p className="mt-5 flex items-start gap-3 rounded-xl bg-light-blue p-4 text-xs leading-6 text-slate-600"><Icon name="shield" className="mt-1 size-4 text-accent" />{t("Conservez ce lien privé. Toute personne qui le possède peut consulter ce suivi et ses photos. Ne le partagez pas publiquement.")}</p>
    <section aria-label={t("Informations de suivi")} className="surface mt-6 p-5 sm:p-8">
      <div className="rounded-xl bg-background p-5">
        <h2 className="flex items-center gap-2 font-semibold"><Icon name="message" className="text-accent" />{t("Réponse du dentiste")}</h2>
        {request.dentist_decision && <p className="mt-3 text-sm font-semibold">{t("Décision : ")}{t(decisionLabels[request.dentist_decision] ?? "Non renseignée")}</p>}
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{request.dentist_response || t("Aucune réponse disponible pour le moment.")}</p>
        {request.dentist_decision === "appointment" && request.proposed_appointment_at && <div className="mt-4 rounded-xl bg-light-blue p-4 text-sm leading-6"><p>{t("Rendez-vous proposé (heure de Beyrouth) : ")}{date(request.proposed_appointment_at, locale)}</p><p className="mt-2">{t("Cette proposition ne constitue pas une réservation automatique.")}</p></div>}
        {(request.dentist_decision === "call" || request.dentist_decision === "video") && request.call_video_details && <div className="mt-4 text-sm leading-6"><p className="font-semibold">{request.dentist_decision === "video" ? t("Instructions de téléconsultation vidéo") : t("Instructions d’appel")}</p><p className="mt-2 whitespace-pre-wrap break-words">{request.call_video_details}</p></div>}
      </div>
      <div className="mt-5"><TrackingRefresh /><p className="mt-3 text-xs leading-6 text-slate-500">{t("Dernière mise à jour : ")}{date(request.updated_at, locale)}{t(". Les réponses ne sont pas actualisées automatiquement.")}</p></div>
      <details className="mt-6 border-t border-slate-100 pt-2"><summary className="min-h-11 py-3 text-sm font-semibold">{t("Détails de la demande")}</summary>
      <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">{t("Référence de la demande")}</dt><dd className="mt-1 break-all font-semibold"><bdi dir="ltr">{request.request_reference}</bdi></dd></div>
        <div><dt className="text-slate-500">{t("Date d’enregistrement (heure de Beyrouth)")}</dt><dd className="mt-1">{date(request.created_at, locale)}</dd></div>
        <div><dt className="text-slate-500">{t("Service")}</dt><dd className="mt-1">{t(request.department)}</dd></div>
        <div><dt className="text-slate-500">{t("Motif de contact")}</dt><dd className="mt-1">{t(reasons.find((reason) => reason.id === request.reason)?.label ?? request.reason)}</dd></div>
        <div><dt className="text-slate-500">{t("Statut actuel")}</dt><dd className="mt-2 inline-block rounded-full bg-light-blue px-4 py-2 font-semibold">{t(statusLabels[request.status] ?? request.status)}</dd></div>
      </dl>
      </details>
      {request.photos.length > 0 && <section aria-label={t("Photos jointes")} className="mt-7 border-t border-slate-200 pt-5">
        <h2 className="font-semibold">{t("Photos jointes")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">{request.photos.map((photo, index) => (
          // Protected images must bypass Next Image's public optimization cache.
          // eslint-disable-next-line @next/next/no-img-element
          <img key={photo.id} src={`/api/requests/track/${token}/photos/${photo.id}`} referrerPolicy="no-referrer" alt={t("Photo jointe {0}", [index + 1])} className="h-48 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain" />
        ))}</div>
      </section>}
    </section>
    <p className="mt-6 text-sm leading-6 text-slate-600">{t("Prototype local : utilisez uniquement des informations fictives. En cas d’urgence grave, consultez immédiatement les urgences sans attendre une réponse en ligne.")}</p>
  </div>;
}
