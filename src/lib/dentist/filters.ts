export const statusFilters = [
  { value: "all", label: "Toutes" },
  { value: "nouveau", label: "Nouvelles" },
  { value: "en_cours", label: "En cours" },
  { value: "repondu", label: "Répondues" },
  { value: "rendez_vous_propose", label: "Rendez-vous proposé" },
  { value: "cloture", label: "Clôturées" },
] as const;
export const priorityFilters = [
  { value: "all", label: "Toutes" }, { value: "normal", label: "Normale" }, { value: "high", label: "Haute" },
] as const;
export { statusLabels } from "@/lib/requests/evaluation";

export function dashboardFilters(status: unknown, priority: unknown) {
  return {
    status: statusFilters.find((item) => item.value === status)?.value ?? "all",
    priority: priorityFilters.find((item) => item.value === priority)?.value ?? "all",
  };
}
