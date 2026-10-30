import { saveRequest } from "@/lib/requests/storage";
import { RequestValidationError, validateRequest } from "@/lib/requests/validation";
import { BodyTooLargeError, privateJson, readRequestForm } from "@/lib/requests/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  // Next may build request.url from the bind address (e.g. localhost), while
  // the browser uses 127.0.0.1. The HTTP Host identifies the actual local origin.
  const localOrigin = new URL(request.url);
  const host = request.headers.get("host");
  if (host) localOrigin.host = host;
  if ((origin && origin !== localOrigin.origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return privateJson({ error: "Origine de la demande non autorisée." }, 403);
  }
  let form: FormData;
  try { form = await readRequestForm(request); }
  catch (error) {
    return privateJson({ error: error instanceof BodyTooLargeError ? "La demande est trop volumineuse (maximum 16 Mo)." : "Le formulaire reçu est invalide." }, error instanceof BodyTooLargeError ? 413 : 400);
  }
  let data: unknown;
  try {
    const raw = form.get("data");
    if (typeof raw !== "string" || raw.length > 16000 || form.getAll("data").length !== 1 ||
        Array.from(form.keys()).some((key) => key !== "data" && key !== "photos")) throw new Error();
    data = JSON.parse(raw);
  } catch { return privateJson({ error: "Les informations de la demande sont invalides." }, 400); }
  try {
    const input = validateRequest(data);
    const photos = form.getAll("photos");
    if (photos.some((photo) => !(photo instanceof File))) throw new RequestValidationError("Les photos reçues sont invalides.");
    return privateJson(await saveRequest(input, photos as File[]), 201);
  } catch (error) {
    if (error instanceof RequestValidationError) return privateJson({ error: error.message }, 400);
    // Do not log the request body, private URLs, tokens, or patient information.
    console.error("Local request storage failed.");
    return privateJson({ error: "L’enregistrement n’a pas pu être confirmé. Vérifiez le serveur local avant de réessayer." }, 500);
  }
}
