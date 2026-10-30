export const statusFilters = [
  { value: "all", label: "Toutes" },
  { value: "nouveau", label: "Nouvelles" },
  { value: "en_cours", label: "En cours" },
  { value: "repondu", label: "Répondues" },
  { value: "cloture", label: "Clôturées" },
] as const;
export const priorityFilters = [
  { value: "all", label: "Toutes" }, { value: "normal", label: "Normale" }, { value: "high", label: "Haute" },
] as const;
export const statusLabels: Record<string, string> = {
  nouveau: "Nouveau", en_cours: "En cours", repondu: "Répondu", cloture: "Clôturé",
};

export function dashboardFilters(status: unknown, priority: unknown) {
  return {
    status: statusFilters.find((item) => item.value === status)?.value ?? "all",
    priority: priorityFilters.find((item) => item.value === priority)?.value ?? "all",
  };
}
