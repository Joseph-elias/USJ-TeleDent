import { departments } from "@/components/patient/patient-data";

export const requestStatuses = [
  { value: "nouveau", label: "Nouveau" }, { value: "en_cours", label: "En cours" },
  { value: "repondu", label: "Répondu" }, { value: "rendez_vous_propose", label: "Rendez-vous proposé" },
  { value: "cloture", label: "Clôturé" },
] as const;
export const statusLabels: Record<string, string> = Object.fromEntries(requestStatuses.map(item => [item.value, item.label]));
export const decisions = [
  { value: "advice", label: "Réponse à distance / Conseils", defaultStatus: "repondu" },
  { value: "call", label: "Appel téléphonique", defaultStatus: "en_cours" },
  { value: "video", label: "Téléconsultation vidéo", defaultStatus: "en_cours" },
  { value: "appointment", label: "Rendez-vous au centre", defaultStatus: "rendez_vous_propose" },
  { value: "transfer", label: "Réorientation vers un autre département", defaultStatus: "nouveau" },
] as const;
export const decisionLabels: Record<string, string> = Object.fromEntries(decisions.map(item => [item.value, item.label]));
export type Evaluation = {
  priority: "normal" | "high";
  status: (typeof requestStatuses)[number]["value"];
  dentist_decision: (typeof decisions)[number]["value"];
  dentist_response: string | null;
  proposed_appointment_at: string | null;
  call_video_details: string | null;
  department: string;
};
export type SavedEvaluation = Evaluation & { updated_at: string };
export class EvaluationValidationError extends Error {}

function optionalText(value: unknown, label: string, max: number) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > max) throw new EvaluationValidationError(`${label} : maximum ${max} caractères.`);
  return value.trim() || null;
}

export function validateEvaluation(value: unknown, current: { department: string; proposed_appointment_at?: string | null }): Evaluation {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new EvaluationValidationError("L’évaluation reçue est invalide.");
  const data = value as Record<string, unknown>;
  const allowed = ["priority", "status", "dentist_decision", "dentist_response", "proposed_appointment_at", "call_video_details", "department"];
  if (Object.keys(data).some(key => !allowed.includes(key))) throw new EvaluationValidationError("La demande contient des champs dont la modification n’est pas autorisée.");
  if (data.priority !== "normal" && data.priority !== "high") throw new EvaluationValidationError("Choisissez une priorité valide.");
  const decision = decisions.find(item => item.value === data.dentist_decision);
  if (!decision) throw new EvaluationValidationError("Choisissez une décision valide.");
  const status = data.status === undefined ? decision.defaultStatus : data.status;
  if (!requestStatuses.some(item => item.value === status)) throw new EvaluationValidationError("Choisissez un statut valide.");
  const response = optionalText(data.dentist_response, "Réponse au patient", 4000);
  if (decision.value !== "transfer" && !response) throw new EvaluationValidationError("La réponse au patient est obligatoire.");
  let department = current.department;
  if (decision.value === "transfer") {
    if (!departments.some(item => item === data.department) || data.department === current.department) throw new EvaluationValidationError("Choisissez un autre département valide pour la réorientation.");
    if (status !== "nouveau") throw new EvaluationValidationError("Une demande réorientée doit avoir le statut Nouveau dans le service destinataire.");
    department = data.department as string;
  } else if (data.department !== undefined) {
    throw new EvaluationValidationError("Le département peut être modifié uniquement lors d’une réorientation.");
  }
  let appointment: string | null = null;
  if (decision.value === "appointment") {
    const raw = data.proposed_appointment_at;
    if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(raw)) throw new EvaluationValidationError("Indiquez une date et une heure de rendez-vous valides.");
    const date = new Date(raw);
    const day = new Date(`${raw.slice(0, 10)}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || !Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== raw.slice(0, 10)) throw new EvaluationValidationError("La date proposée est invalide.");
    appointment = date.toISOString();
    if (date.getTime() <= Date.now() && appointment !== current.proposed_appointment_at) throw new EvaluationValidationError("Le nouveau rendez-vous proposé doit être dans le futur.");
  } else if (data.proposed_appointment_at != null && data.proposed_appointment_at !== "") {
    throw new EvaluationValidationError("Une date de rendez-vous est autorisée uniquement pour un rendez-vous au centre.");
  }
  const instructions = optionalText(data.call_video_details, "Instructions d’appel ou de vidéo", 2000);
  if (instructions && decision.value !== "call" && decision.value !== "video") throw new EvaluationValidationError("Les instructions d’appel ou de vidéo ne correspondent pas à la décision choisie.");
  return {
    priority: data.priority, status: status as Evaluation["status"], dentist_decision: decision.value,
    dentist_response: response, proposed_appointment_at: appointment, call_video_details: instructions, department,
  };
}
