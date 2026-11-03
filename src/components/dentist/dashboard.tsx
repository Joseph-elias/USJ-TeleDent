import { getI18n } from "@/lib/i18n/server";
import { dateLocales } from "@/lib/i18n/shared";
import Link from "next/link";
import { Icon, StatusBadge } from "@/components/ui";
import { DentistShell } from "./shell";
import { reasons } from "@/components/patient/patient-data";
import { priorityFilters, statusFilters, statusLabels } from "@/lib/dentist/filters";
import type { loadDashboard } from "@/lib/dentist/dashboard";

type DashboardData = NonNullable<Awaited<ReturnType<typeof loadDashboard>>>;


export async function DentistDashboard({ data, transferred = false }: { data: DashboardData; transferred?: boolean }) {
  const { t, locale } = await getI18n();
  const date = new Intl.DateTimeFormat(dateLocales[locale], { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Beirut" });
  const { dentist, counts, filters, requests } = data;
  const cards = [
    ["Total des demandes", counts.total], ["Nouvelles demandes", counts.nouveaux],
    ["Demandes en cours", counts.en_cours], ["Demandes traitées", counts.traites],
  ] as const;
  return <DentistShell dentist={dentist}>
      <p className="eyebrow">{t(dentist.department)}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t("Tableau de bord")}</h1>
      {transferred && <p role="status" className="mt-5 rounded-xl bg-light-blue p-4 text-sm font-semibold leading-6">{t("La demande a été réorientée. Elle est désormais accessible au service destinataire et n’apparaît plus dans votre service.")}</p>}
      <p className="mt-3 text-sm leading-6 text-slate-600">{t("Bonjour {0}. Retrouvez les demandes adressées à votre service.", [dentist.full_name])}</p>

      <section aria-label={t("Résumé des demandes de votre service")} className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(([label, count], index) => <div key={label} className={`rounded-2xl border p-4 sm:p-5 ${index === 0 ? "border-navy bg-navy text-white" : "border-slate-200 bg-white"}`}>
          <p className={`text-xs leading-5 sm:text-sm ${index === 0 ? "text-sky-100" : "text-slate-600"}`}>{t(label)}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{count}</p>
        </div>)}
      </section>
      <details className="mt-2 text-xs leading-6 text-slate-500"><summary className="min-h-11 py-3">{t("À propos des totaux de votre service")}</summary><p>{t("Totaux indépendants des filtres. Les demandes en cours incluent les rendez-vous proposés. Les demandes traitées regroupent les demandes répondues et clôturées.")}</p></details>

      <section aria-labelledby="requests-heading" className="surface mt-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="requests-heading" className="text-xl font-semibold">{t("Demandes des patients")}</h2>
          <span className="text-sm text-slate-500">{t("{0} demandes affichées", [requests.length])}</span>
        </div>
        <nav aria-label={t("Filtrer par statut")} className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {statusFilters.map((item) => <Link key={item.value} prefetch={false}
            href={`/dentist?status=${item.value}&priority=${filters.priority}`}
            aria-current={filters.status === item.value ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-lg border px-3 py-2 text-xs font-semibold ${filters.status === item.value ? "border-navy bg-navy text-white" : "border-slate-200 text-slate-600 hover:bg-light-blue"}`}>{t(item.label)}</Link>)}
        </nav>
        <form method="get" action="/dentist" className="my-5 flex items-end gap-3">
          <input type="hidden" name="status" value={filters.status} />
          <div className="min-w-0 flex-1 sm:max-w-64"><label htmlFor="priority-filter" className="block text-xs font-semibold text-slate-600">{t("Priorité")}</label>
            <select id="priority-filter" name="priority" defaultValue={filters.priority} className="form-control">
              {priorityFilters.map((item) => <option key={item.value} value={item.value}>{t(item.label)}</option>)}
            </select>
          </div>
          <button type="submit" className="button button-secondary">{t("Appliquer")}</button>
        </form>

        {!requests.length ? <div role="status" className="rounded-2xl border border-dashed border-slate-300 bg-light-blue/40 p-10 text-center">
          <p className="font-semibold">{counts.total ? t("Aucune demande ne correspond à ces filtres.") : t("Aucune demande pour votre service pour le moment.")}</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">{counts.total ? t("Essayez un autre statut ou une autre priorité.") : t("Les nouvelles demandes de votre service apparaîtront ici.")}</p>
          {counts.total > 0 && <Link href="/dentist" className="text-link mt-3">{t("Réinitialiser les filtres")}</Link>}
        </div> : <>
          <ul aria-label={t("Demandes des patients")} className="grid gap-3 md:grid-cols-2 xl:hidden">
            {requests.map(request => <li key={request.id} className="min-w-0">
              <Link href={`/dentist/requests/${request.id}`} prefetch={false} className="group block h-full rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-sky-500" aria-label={t("Ouvrir la demande de {0}, {1}", [request.patient_name, request.request_reference])}>
                <div className="flex flex-wrap items-center gap-2"><StatusBadge status={request.status}>{t(statusLabels[request.status] ?? request.status)}</StatusBadge>{request.priority === "high" && <StatusBadge status="high">{t("Priorité haute")}</StatusBadge>}</div>
                <p className="mt-4 break-words text-base font-semibold">{request.patient_name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t(reasons.find(reason => reason.id === request.reason)?.label ?? request.reason)}</p>
                <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Icon name="clock" className="size-3.5" />{date.format(new Date(request.created_at))}</p>
                <p className="mt-2 break-words text-xs leading-5 text-slate-500">{t(request.department)}</p>
                <p className="mt-3 break-all font-mono text-[.625rem] leading-5 text-slate-500"><bdi dir="ltr">{request.request_reference}</bdi></p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-accent"><span>{t("Consulter le dossier")}</span><Icon name="arrow" className="size-4" /></div>
              </Link>
            </li>)}
          </ul>
          <div tabIndex={0} role="region" aria-label={t("Tableau des demandes, défilement horizontal disponible")} className="hidden overflow-x-auto rounded-xl border border-slate-200 xl:block">
          <table className="w-full min-w-[850px] text-start text-sm">
            <caption className="sr-only">{t("Demandes du service {0}", [t(dentist.department)])}</caption>
            <thead className="border-b border-slate-200 bg-light-blue text-xs text-slate-600"><tr>
              {["Référence", "Patient", "Motif de contact", "Service", "Date d’envoi", "Statut", "Priorité"].map((label) => <th key={label} scope="col" className="px-4 py-4 font-semibold">{t(label)}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">{requests.map((request) => <tr key={request.id} className="align-top hover:bg-sky-50/50">
              <td className="max-w-52 break-all px-4 py-5 text-xs font-semibold"><Link href={`/dentist/requests/${request.id}`} prefetch={false} className="underline decoration-sky-300 underline-offset-4 hover:decoration-navy" aria-label={t("Ouvrir la demande {0}", [request.request_reference])}><bdi dir="ltr">{request.request_reference}</bdi></Link></td>
              <td className="max-w-48 break-words px-4 py-5 font-medium">{request.patient_name}</td>
              <td className="max-w-56 px-4 py-5 text-slate-600">{t(reasons.find((reason) => reason.id === request.reason)?.label ?? request.reason)}</td>
              <td className="px-4 py-5 text-slate-600">{t(request.department)}</td>
              <td className="whitespace-nowrap px-4 py-5 text-xs text-slate-600">{date.format(new Date(request.created_at))}</td>
              <td className="px-4 py-5"><StatusBadge status={request.status}>{t(statusLabels[request.status] ?? request.status)}</StatusBadge></td>
              <td className="px-4 py-5"><span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${request.priority === "high" ? "bg-rose-50 text-rose-800" : "bg-slate-100 text-slate-600"}`}>{request.priority === "high" ? t("Haute") : request.priority === "normal" ? t("Normale") : request.priority}</span></td>
            </tr>)}</tbody>
          </table>
        </div></>}
        <p className="mt-5 text-xs leading-6 text-slate-500">{t("Heure de Beyrouth. Ouvrez une demande pour consulter le dossier et enregistrer une évaluation.")}</p>
      </section>
      <p className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-500">{t("Prototype local — données fictives uniquement.")}</p>
  </DentistShell>;
}
