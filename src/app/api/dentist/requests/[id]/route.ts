import { updateDentistEvaluation } from "@/lib/dentist/evaluation-storage";
import { dentistForSession } from "@/lib/dentist/auth";
import { currentDentistToken } from "@/lib/dentist/session";
import { isLocalOrigin } from "@/lib/dentist/http";
import { EvaluationValidationError } from "@/lib/requests/evaluation";
import { notFoundResponse, privateJson } from "@/lib/requests/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readEvaluation(request: Request): Promise<unknown> {
  if (!request.body || !request.headers.get("content-type")?.startsWith("application/json")) throw new Error();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 32 * 1024) { await reader.cancel(); throw new Error(); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally { reader.releaseLock(); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isLocalOrigin(request)) return privateJson({ error: "Origine non autorisée." }, 403);
  try {
    const token = await currentDentistToken();
    if (!await dentistForSession(token)) return privateJson({ error: "Connexion requise." }, 401);
    let input: unknown;
    try { input = await readEvaluation(request); }
    catch { return privateJson({ error: "L’évaluation reçue est invalide ou trop volumineuse." }, 400); }
    const result = await updateDentistEvaluation(token, (await params).id, input);
    if (result.status === "unauthenticated") return privateJson({ error: "Connexion requise." }, 401);
    if (result.status === "not_found") return notFoundResponse();
    if (result.status === "busy") return privateJson({ error: "Cette demande est en cours d’enregistrement. Réessayez dans un instant." }, 409);
    return privateJson({ success: true, transferred: result.transferred, evaluation: result.evaluation });
  } catch (error) {
    if (error instanceof EvaluationValidationError) return privateJson({ error: error.message }, 400);
    return privateJson({ error: "L’enregistrement n’a pas pu être confirmé. Vérifiez le serveur local avant de réessayer." }, 500);
  }
}
