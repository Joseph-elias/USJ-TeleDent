import "server-only";

import { randomUUID } from "node:crypto";
import { open, rename, rm } from "node:fs/promises";
import path from "node:path";
import { readDentistRequestRecord } from "./request-details";
import { validateEvaluation } from "@/lib/requests/evaluation";

export async function updateDentistEvaluation(token: string | undefined, id: string, input: unknown) {
  const initial = await readDentistRequestRecord(token, id);
  if (initial.status !== "ok") return initial;
  // The reader has validated this UUID and the dentist's department before any write.
  const directory = path.join(process.cwd(), ".local-data", "requests");
  const lockPath = path.join(directory, `.${id}.lock`);
  const temporary = path.join(directory, `.${id}.${randomUUID()}.tmp`);
  let lock;
  try { lock = await open(lockPath, "wx", 0o600); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") return { status: "busy" as const }; throw error; }
  try {
    // Recheck inside the exclusive lock: a transfer must invalidate an old
    // department's pending writes, even if its initial read happened earlier.
    const latest = await readDentistRequestRecord(token, id);
    if (latest.status !== "ok") return latest;
    const evaluation = validateEvaluation(input, latest.record);
    const updated_at = new Date().toISOString();
    const updated = { ...latest.record, ...evaluation, updated_at };
    const file = await open(temporary, "wx", 0o600);
    try { await file.writeFile(JSON.stringify(updated, null, 2), "utf8"); await file.sync(); }
    finally { await file.close(); }
    await rename(temporary, path.join(directory, `${id}.json`));
    return {
      status: "ok" as const, transferred: evaluation.department !== latest.record.department,
      evaluation: { ...evaluation, updated_at },
    };
  } finally {
    try { await Promise.all([rm(temporary, { force: true }), lock.close()]); }
    finally { await rm(lockPath, { force: true }); }
  }
}
