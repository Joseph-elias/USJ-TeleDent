"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { departments } from "@/components/patient/patient-data";
import { decisions, decisionLabels, requestStatuses, statusLabels, validateEvaluation, type SavedEvaluation } from "@/lib/requests/evaluation";

type InitialEvaluation = {
  priority: string; status: string; dentist_decision: string | null; dentist_response: string | null;
  proposed_appointment_at: string | null; call_video_details: string | null; department: string; updated_at: string;
};
const control = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm";
const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Beirut" });

function localDateTime(value: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

export function DentistEvaluationForm({ requestId, initial }: { requestId: string; initial: InitialEvaluation }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [priority, setPriority] = useState(initial.priority);
  const [decision, setDecision] = useState(initial.dentist_decision ?? "");
  const [status, setStatus] = useState(initial.status);
  const [response, setResponse] = useState(initial.dentist_response ?? "");
  const [appointment, setAppointment] = useState(localDateTime(initial.proposed_appointment_at));
  const [instructions, setInstructions] = useState(initial.call_video_details ?? "");
  const [department, setDepartment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const saving = useRef(false);
  const errorBox = useRef<HTMLParagraphElement>(null);

  useEffect(() => { if (error) errorBox.current?.focus(); }, [error]);

  function chooseDecision(value: string) {
    setDecision(value);
    setStatus(decisions.find(item => item.value === value)?.defaultStatus ?? "nouveau");
    setError(""); setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    setError(""); setMessage("");
    let payload;
    try {
      const proposed = decision === "appointment" && appointment ? new Date(appointment) : null;
      if (decision === "appointment" && (!proposed || !Number.isFinite(proposed.getTime()))) throw new Error("Indiquez une date et une heure de rendez-vous valides.");
      const input = {
        priority, status: decision === "transfer" ? "nouveau" : status,
        dentist_decision: decision, dentist_response: response,
        proposed_appointment_at: proposed?.toISOString() ?? null,
        call_video_details: decision === "call" || decision === "video" ? instructions : null,
        ...(decision === "transfer" ? { department } : {}),
      };
      const validated = validateEvaluation(input, saved);
      // The API only accepts a department field for transfers.
      const { department: destination, ...evaluation } = validated;
      payload = decision === "transfer" ? { ...evaluation, department: destination } : evaluation;
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Vérifiez votre évaluation."); return; }
    saving.current = true; setBusy(true);
    try {
      const result = await fetch(`/api/dentist/requests/${requestId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store",
      });
      const data = await result.json();
      if (!result.ok) { setError(data.error || "Enregistrement impossible pour le moment."); return; }
      if (data.transferred) {
        setMessage("Réorientation enregistrée. Retour au tableau de bord…");
        // Discard cached clinical pages after losing department access.
        window.location.replace("/dentist?transferred=1");
        return;
      }
      const evaluation = data.evaluation as SavedEvaluation;
      setSaved(evaluation);
      setPriority(evaluation.priority); setStatus(evaluation.status);
      setDecision(evaluation.dentist_decision); setResponse(evaluation.dentist_response ?? "");
      setAppointment(localDateTime(evaluation.proposed_appointment_at)); setInstructions(evaluation.call_video_details ?? "");
      setMessage("La décision et la réponse ont été enregistrées. Le patient peut les consulter avec son lien privé.");
      router.refresh();
    } catch { setError("L’enregistrement n’a pas pu être confirmé. Vérifiez le serveur local avant de réessayer."); }
    finally { saving.current = false; setBusy(false); }
  }

  return <>
    <p className="mt-3 text-sm leading-6 text-slate-600">Rédigez vous-même la réponse. Les appels, vidéos et rendez-vous sont des propositions manuelles ; aucune réservation ni notification n’est effectuée.</p>
    {saved.dentist_decision ? <div aria-label="Évaluation enregistrée" className="mt-5 rounded-xl bg-light-blue p-5 text-sm leading-6">
      <h3 className="font-semibold">Dernière évaluation enregistrée</h3>
      <dl className="mt-3 space-y-3">
        <div><dt className="text-slate-600">Décision</dt><dd className="font-medium">{decisionLabels[saved.dentist_decision] ?? "Non renseignée"}</dd></div>
        <div><dt className="text-slate-600">Statut et priorité</dt><dd>{statusLabels[saved.status] ?? saved.status} · {saved.priority === "high" ? "Haute" : "Normale"}</dd></div>
        <div><dt className="text-slate-600">Réponse au patient</dt><dd className="whitespace-pre-wrap break-words">{saved.dentist_response || "Aucune réponse enregistrée."}</dd></div>
        {saved.proposed_appointment_at && <div><dt className="text-slate-600">Rendez-vous proposé (heure de Beyrouth)</dt><dd>{date.format(new Date(saved.proposed_appointment_at))}</dd></div>}
        {saved.call_video_details && <div><dt className="text-slate-600">Instructions d’appel ou de vidéo</dt><dd className="whitespace-pre-wrap break-words">{saved.call_video_details}</dd></div>}
        <div><dt className="text-slate-600">Dernière modification (heure de Beyrouth)</dt><dd>{date.format(new Date(saved.updated_at))}</dd></div>
      </dl>
    </div> : <p className="mt-4 text-sm text-slate-500">Aucune décision enregistrée pour le moment.</p>}

    <form noValidate onSubmit={submit} className="mt-7 space-y-5">
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
        <legend className="sr-only">Enregistrer une évaluation</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor="evaluation-priority" className="text-sm font-semibold">Priorité</label><select id="evaluation-priority" value={priority} onChange={event => setPriority(event.target.value)} className={control}><option value="normal">Normale</option><option value="high">Haute</option></select></div>
          <div><label htmlFor="evaluation-decision" className="text-sm font-semibold">Décision</label><select id="evaluation-decision" required value={decision} onChange={event => chooseDecision(event.target.value)} className={control}><option value="">Choisir une décision</option>{decisions.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        </div>
        <div><label htmlFor="evaluation-status" className="text-sm font-semibold">Statut à enregistrer</label><select id="evaluation-status" disabled={decision === "transfer"} value={decision === "transfer" ? "nouveau" : status} onChange={event => setStatus(event.target.value)} className={control}>{requestStatuses.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          <p className="mt-2 text-xs leading-5 text-slate-500">{decision === "transfer" ? "La demande aura le statut Nouveau dans le service destinataire." : "Un statut est proposé selon la décision. Vous pouvez le modifier ; une demande n’est jamais clôturée automatiquement."}</p>
        </div>
        {decision === "transfer" && <div><label htmlFor="evaluation-department" className="text-sm font-semibold">Département destinataire</label><select id="evaluation-department" required value={department} onChange={event => setDepartment(event.target.value)} className={control}><option value="">Choisir un autre département</option>{departments.map(item => <option key={item} value={item} disabled={item === saved.department}>{item}{item === saved.department ? " (service actuel)" : ""}</option>)}</select><p className="mt-2 text-xs leading-5 text-slate-500">Votre service perdra l’accès au dossier après la réorientation. Le lien privé du patient restera valide.</p></div>}
        <div><label htmlFor="evaluation-response" className="text-sm font-semibold">Réponse au patient{decision === "transfer" ? " / Note de réorientation (facultatif)" : ""}</label><textarea id="evaluation-response" required={decision !== "transfer"} maxLength={4000} rows={5} value={response} onChange={event => setResponse(event.target.value)} className={control} />
          {decision === "transfer" && <p className="mt-2 text-xs text-slate-500">La note de réorientation est visible par le patient et le service destinataire.</p>}
        </div>
        {(decision === "call" || decision === "video") && <div><label htmlFor="evaluation-instructions" className="text-sm font-semibold">{decision === "video" ? "Instructions ou lien de téléconsultation vidéo (facultatif)" : "Instructions d’appel ou horaire proposé (facultatif)"}</label><textarea id="evaluation-instructions" maxLength={2000} rows={3} value={instructions} onChange={event => setInstructions(event.target.value)} className={control} /></div>}
        {decision === "appointment" && <div><label htmlFor="evaluation-appointment" className="text-sm font-semibold">Date et heure de rendez-vous proposées</label><input id="evaluation-appointment" type="datetime-local" required value={appointment} onChange={event => setAppointment(event.target.value)} className={control} /><p className="mt-2 text-xs leading-5 text-slate-500">Saisissez l’heure locale de votre appareil. Le suivi l’affiche à l’heure de Beyrouth. Il s’agit d’une proposition, pas d’une réservation.</p></div>}
      </fieldset>
      {error && <p ref={errorBox} tabIndex={-1} role="alert" className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</p>}
      <button type="submit" disabled={busy} className="min-h-12 rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-sky-900 disabled:cursor-wait disabled:opacity-60">{busy ? "Enregistrement en cours…" : "Enregistrer la décision"}</button>
      <p role="status" className="text-sm font-semibold leading-6">{busy ? "Enregistrement de votre évaluation…" : message}</p>
    </form>
  </>;
}
