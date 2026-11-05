import { careContexts } from "@/components/patient/patient-data";
import type { RequestInput } from "./types";

export function getUrgency(reason: string, answers: Record<string, string>) {
  if (answers.emergency_signs === "Oui" ||
      (reason === "swelling" && [answers.breathing, answers.swallowing, answers.opening].includes("Oui"))) {
    return "immediate";
  }
  if (answers.urgent_signs === "Oui" ||
      (reason === "swelling" && [answers.increasing, answers.fever].includes("Oui")) ||
      (reason === "bleeding" && [answers.active, answers.persistent].includes("Oui")) ||
      (reason === "trauma" && [answers.tooth, answers.bleeding].includes("Oui")) ||
      (reason === "pain" && answers.swelling === "Oui")) {
    return "urgent";
  }
  return null;
}

export function routeRequest(input: RequestInput, today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Beirut" })) {
  const { reason, symptom_answers: answers } = input;
  if (getUrgency(reason, answers)) return { department: "Urgences", priority: "high" };

  // Review ambiguous cases in the prototype's existing acute-care queue.
  const review = { department: "Urgences", priority: "normal" };
  if (answers.emergency_signs !== "Non" || answers.urgent_signs !== "Non" ||
      reason === "swelling" || reason === "trauma" ||
      (reason === "bleeding" && (answers.active !== "Non" || answers.persistent !== "Non")) ||
      (reason === "pain" && answers.swelling !== "Non") ||
      (reason === "followup" && (answers.evolution === "Il s’aggrave" || answers.evolution === "Je ne sais pas")) ||
      (reason === "restoration" && answers.pain !== "Non")) return review;

  const birthDate = input.date_of_birth;
  const age = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4)) -
    (today.slice(5) < birthDate.slice(5) ? 1 : 0);
  if (age < 18) return { department: "Pédodontie", priority: "normal" };

  if (reason === "restoration") return { department: "Dentisterie restauratrice / conjointe", priority: "normal" };
  const context = answers.care_context;
  if (context === careContexts.surgery) return { department: "Chirurgie bucco-dentaire", priority: "normal" };
  if (context === careContexts.gums) return { department: "Parodontologie", priority: "normal" };
  if (context === careContexts.rootCanal && reason !== "bleeding") return { department: "Endodontie", priority: "normal" };
  if (context === careContexts.restoration && reason !== "bleeding") {
    return { department: "Dentisterie restauratrice / conjointe", priority: "normal" };
  }
  return review;
}
