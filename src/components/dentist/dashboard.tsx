import Link from "next/link";
import { Brand } from "@/components/brand";
import { reasons } from "@/components/patient/patient-data";
import { priorityFilters, statusFilters, statusLabels } from "@/lib/dentist/filters";
import type { loadDashboard } from "@/lib/dentist/dashboard";

type DashboardData = NonNullable<Awaited<ReturnType<typeof loadDashboard>>>;
const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Beirut" });

export function DentistDashboard({ data }: { data: DashboardData }) {
  const { dentist, counts, filters, requests } = data;
  const cards = [
    ["Total des demandes", counts.total], ["Nouvelles demandes", counts.nouveaux],
    ["Demandes en cours", counts.en_cours], ["Demandes traitées", counts.traites],
  ] as const;
  return <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col lg:flex-row">
    <aside aria-label="Espace dentiste" className="flex shrink-0 flex-col bg-navy p-6 text-white lg:w-64 lg:py-9">
      <div className="rounded-xl bg-white p-3"><Brand /></div>
      <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-sky-200">Espace dentiste</p>
      <nav aria-label="Navigation dentiste" className="mt-4">
        <Link href="/dentist" prefetch={false} aria-current="page" className="block rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20">Tableau de bord</Link>
      </nav>
      <div className="mt-7 border-t border-white/20 pt-6 lg:mt-auto">
        <p className="font-semibold">{dentist.full_name}</p>
        <p className="mt-2 text-sm leading-6 text-sky-100">{dentist.department}</p>
        <form method="post" action="/api/dentist/logout" className="mt-5">
          <button type="submit" className="min-h-11 w-full rounded-xl border border-white/40 px-4 py-3 text-left text-sm font-semibold hover:bg-white/10">Se déconnecter</button>
        </form>
      </div>
    </aside>

    <div className="min-w-0 flex-1 bg-white px-5 py-8 sm:px-8 lg:py-10">
      <p className="eyebrow">{dentist.department}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Tableau de bord</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Bonjour {dentist.full_name}. Retrouvez les demandes adressées à votre service.</p>

      <section aria-label="Résumé des demandes de votre service" className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(([label, count], index) => <div key={label} className={`rounded-2xl border p-5 ${index === 0 ? "border-navy bg-navy text-white" : "border-slate-200 bg-light-blue/50"}`}>
          <p className={`text-xs leading-5 sm:text-sm ${index === 0 ? "text-sky-100" : "text-slate-600"}`}>{label}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{count}</p>
        </div>)}
      </section>
      <p className="mt-3 text-xs leading-5 text-slate-500">Totaux de votre service, indépendants des filtres. Les demandes traitées regroupent les demandes répondues et clôturées.</p>

      <section aria-labelledby="requests-heading" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="requests-heading" className="text-xl font-semibold">Demandes des patients</h2>
          <span className="text-sm text-slate-500">{requests.length} demande{requests.length > 1 ? "s" : ""} affichée{requests.length > 1 ? "s" : ""}</span>
        </div>
        <nav aria-label="Filtrer par statut" className="mt-5 flex flex-wrap gap-2">
          {statusFilters.map((item) => <Link key={item.value} prefetch={false}
            href={`/dentist?status=${item.value}&priority=${filters.priority}`}
            aria-current={filters.status === item.value ? "page" : undefined}
            className={`rounded-lg border px-4 py-3 text-sm font-semibold ${filters.status === item.value ? "border-navy bg-navy text-white" : "border-slate-200 text-slate-600 hover:bg-light-blue"}`}>{item.label}</Link>)}
        </nav>
        <form method="get" action="/dentist" className="my-5 flex flex-wrap items-end gap-3">
          <input type="hidden" name="status" value={filters.status} />
          <div><label htmlFor="priority-filter" className="block text-xs font-semibold text-slate-600">Priorité</label>
            <select id="priority-filter" name="priority" defaultValue={filters.priority} className="mt-2 min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              {priorityFilters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <button type="submit" className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-light-blue">Appliquer</button>
        </form>

        {!requests.length ? <div role="status" className="rounded-2xl border border-dashed border-slate-300 bg-light-blue/40 p-10 text-center">
          <p className="font-semibold">{counts.total ? "Aucune demande ne correspond à ces filtres." : "Aucune demande pour votre service pour le moment."}</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">{counts.total ? "Essayez un autre statut ou une autre priorité." : "Les nouvelles demandes de votre service apparaîtront ici."}</p>
        </div> : <div tabIndex={0} role="region" aria-label="Tableau des demandes, défilement horizontal disponible" className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <caption className="sr-only">Demandes du service {dentist.department}</caption>
            <thead className="border-b border-slate-200 bg-light-blue text-xs text-slate-600"><tr>
              {["Référence", "Patient", "Motif de contact", "Service", "Date d’envoi", "Statut", "Priorité"].map((label) => <th key={label} scope="col" className="px-4 py-4 font-semibold">{label}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">{requests.map((request) => <tr key={request.id} className="align-top hover:bg-sky-50/50">
              <td className="max-w-52 break-all px-4 py-5 text-xs font-semibold">{request.request_reference}</td>
              <td className="max-w-48 break-words px-4 py-5 font-medium">{request.patient_name}</td>
              <td className="max-w-56 px-4 py-5 text-slate-600">{reasons.find((reason) => reason.id === request.reason)?.label ?? request.reason}</td>
              <td className="px-4 py-5 text-slate-600">{request.department}</td>
              <td className="whitespace-nowrap px-4 py-5 text-xs text-slate-600">{date.format(new Date(request.created_at))}</td>
              <td className="px-4 py-5"><span className="inline-block whitespace-nowrap rounded-full bg-light-blue px-3 py-1 text-xs font-semibold">{statusLabels[request.status] ?? request.status}</span></td>
              <td className="px-4 py-5"><span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${request.priority === "high" ? "bg-rose-50 text-rose-800" : "bg-slate-100 text-slate-600"}`}>{request.priority === "high" ? "Haute" : request.priority === "normal" ? "Normale" : request.priority}</span></td>
            </tr>)}</tbody>
          </table>
        </div>}
        <p className="mt-5 text-xs leading-6 text-slate-500">Heure de Beyrouth. Consultation de la liste uniquement : les dossiers et leur modification ne sont pas encore disponibles.</p>
      </section>
      <p className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-500">Prototype local — données fictives uniquement.</p>
    </div>
  </div>;
}
