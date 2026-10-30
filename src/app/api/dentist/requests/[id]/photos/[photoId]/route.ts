import { loadDentistPhoto } from "@/lib/dentist/request-details";
import { currentDentistToken } from "@/lib/dentist/session";
import { notFoundResponse, privateHeaders, privateJson } from "@/lib/requests/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    const { id, photoId } = await params;
    const result = await loadDentistPhoto(await currentDentistToken(), id, photoId);
    if (result.status === "unauthenticated") return privateJson({ error: "Connexion requise." }, 401);
    if (result.status === "not_found") return notFoundResponse();
    return new Response(new Uint8Array(result.bytes), {
      headers: { ...privateHeaders, "Content-Type": result.contentType, "Content-Disposition": "inline" },
    });
  } catch { return privateJson({ error: "La photo est temporairement indisponible." }, 500); }
}
