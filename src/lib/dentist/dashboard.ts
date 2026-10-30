import "server-only";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { dentistForSession } from "./auth";
import { dashboardFilters } from "./filters";
import type { SavedRequest } from "@/lib/requests/types";

export type DentistRequest = Pick<SavedRequest,
  "id" | "request_reference" | "patient_name" | "reason" | "department" | "created_at" | "status" | "priority"
>;

export async function loadDashboard(token: string | undefined, status?: unknown, priority?: unknown) {
  const dentist = await dentistForSession(token);
  if (!dentist) return null;
  const directory = path.join(process.cwd(), ".local-data", "requests");
  let names: string[];
  try { names = await readdir(directory); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") names = []; else throw error; }
  const requests: DentistRequest[] = [];
  for (const name of names) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$/.test(name)) continue;
    const record: SavedRequest = JSON.parse(await readFile(path.join(directory, name), "utf8"));
    if (record.department !== dentist.department) continue;
    // Explicit projection: no clinical details, contact data, photos, or tracking secrets.
    requests.push({
      id: record.id, request_reference: record.request_reference, patient_name: record.patient_name,
      reason: record.reason, department: record.department, created_at: record.created_at,
      status: record.status, priority: record.priority,
    });
  }
  const counts = {
    total: requests.length,
    nouveaux: requests.filter((item) => item.status === "nouveau").length,
    en_cours: requests.filter((item) => item.status === "en_cours" || item.status === "rendez_vous_propose").length,
    traites: requests.filter((item) => item.status === "repondu" || item.status === "cloture").length,
  };
  const filters = dashboardFilters(status, priority);
  return {
    dentist, counts, filters,
    requests: requests.filter((item) => (filters.status === "all" || item.status === filters.status) &&
      (filters.priority === "all" || item.priority === filters.priority))
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}
