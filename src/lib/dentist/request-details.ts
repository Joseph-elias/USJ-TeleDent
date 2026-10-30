import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { dentistForSession } from "./auth";
import { reasons } from "@/components/patient/patient-data";
import type { SavedRequest } from "@/lib/requests/types";

const root = path.join(process.cwd(), ".local-data");
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const photoExtensions: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};

async function authorizedRecord(token: string | undefined, id: string) {
  const dentist = await dentistForSession(token);
  if (!dentist) return { status: "unauthenticated" as const };
  if (!uuid.test(id)) return { status: "not_found" as const };
  let record: SavedRequest;
  try { record = JSON.parse(await readFile(path.join(root, "requests", `${id}.json`), "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { status: "not_found" as const }; throw error; }
  if (record.id !== id || record.department !== dentist.department) return { status: "not_found" as const };
  return { status: "ok" as const, dentist, record };
}

export async function loadDentistRequest(token: string | undefined, id: string) {
  const result = await authorizedRecord(token, id);
  if (result.status !== "ok") return result;
  const { record, dentist } = result;
  const reason = reasons.find((item) => item.id === record.reason);
  // Explicit projection: never pass a raw saved record to a page or client component.
  return {
    status: "ok" as const, dentist,
    request: {
      id: record.id, request_reference: record.request_reference,
      patient_name: record.patient_name, patient_file_number: record.patient_file_number,
      date_of_birth: record.date_of_birth, phone: record.phone, email: record.email,
      created_at: record.created_at, department: record.department,
      reason_label: reason?.label ?? "Motif non renseigné",
      status: record.status, priority: record.priority, description: record.description,
      symptoms: (reason?.questions ?? []).map((question) => {
        const value = record.symptom_answers?.[question.id];
        return { id: question.id, label: question.label, answer: typeof value === "string" && value.trim() ? value : null };
      }),
      photos: record.photos.filter((photo) => uuid.test(photo.id) && photo.request_id === id).map(({ id }) => ({ id })),
    },
  };
}

export async function loadDentistPhoto(token: string | undefined, id: string, photoId: string) {
  const result = await authorizedRecord(token, id);
  if (result.status !== "ok") return result;
  if (!uuid.test(photoId)) return { status: "not_found" as const };
  const photo = result.record.photos.find((item) => item.id === photoId && item.request_id === id);
  if (!photo || !Object.hasOwn(photoExtensions, photo.content_type)) return { status: "not_found" as const };
  const expectedPath = `${id}/${photoId}.${photoExtensions[photo.content_type]}`;
  // Validate stored metadata as well as route parameters before reading a path.
  if (photo.storage_path !== expectedPath) return { status: "not_found" as const };
  try {
    return { status: "ok" as const, bytes: await readFile(path.join(root, "photos", expectedPath)), contentType: photo.content_type };
  } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { status: "not_found" as const }; throw error; }
}
