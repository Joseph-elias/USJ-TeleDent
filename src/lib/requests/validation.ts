import { departments, reasons } from "@/components/patient/patient-data";
import type { RequestInput } from "./types";

export class RequestValidationError extends Error {}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, label: string, max = 200): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new RequestValidationError(`${label} : saisissez une valeur valide (maximum ${max} caractères).`);
  }
  return value.trim();
}

export function validateRequest(value: unknown): RequestInput {
  if (!object(value)) throw new RequestValidationError("Les informations de la demande sont invalides.");
  const patient_name = text(value.patient_name, "Nom et prénom");
  const patient_file_number = text(value.patient_file_number, "Numéro de dossier USJ");
  const date_of_birth = text(value.date_of_birth, "Date de naissance", 10);
  const parsedDate = new Date(`${date_of_birth}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth) || Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date_of_birth || date_of_birth > new Date().toLocaleDateString("en-CA")) {
    throw new RequestValidationError("La date de naissance doit être valide et non future.");
  }
  const phone = text(value.phone, "Numéro de téléphone", 25);
  if (!/^\+?[\d\s().-]{6,25}$/.test(phone) || phone.replace(/\D/g, "").length < 6) {
    throw new RequestValidationError("Saisissez un numéro de téléphone valide.");
  }
  const email = value.email === null || value.email === undefined || value.email === ""
    ? null : text(value.email, "Email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RequestValidationError("Saisissez une adresse email valide.");
  }
  const reason = reasons.find((item) => item.id === value.reason);
  if (!reason) throw new RequestValidationError("Choisissez un motif de contact valide.");
  if (!departments.some((item) => item === value.department)) {
    throw new RequestValidationError("Choisissez un service valide.");
  }
  if (!object(value.symptom_answers)) throw new RequestValidationError("Répondez aux questions sur vos symptômes.");
  const suppliedAnswers = value.symptom_answers;
  if (Object.keys(suppliedAnswers).some((key) => !reason.questions.some((question) => question.id === key))) {
    throw new RequestValidationError("Les réponses ne correspondent pas au motif sélectionné.");
  }
  const symptom_answers: Record<string, string> = {};
  for (const question of reason.questions) {
    const answer = text(suppliedAnswers[question.id], question.label, 500);
    if (question.options && !question.options.includes(answer)) {
      throw new RequestValidationError(`${question.label} : choisissez une réponse proposée.`);
    }
    symptom_answers[question.id] = answer;
  }
  return {
    patient_name, patient_file_number, date_of_birth, phone, email,
    reason: reason.id,
    department: value.department as string,
    description: text(value.description, "Description", 4000),
    symptom_answers,
  };
}
