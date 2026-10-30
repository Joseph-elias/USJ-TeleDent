import { getTrackingRequest } from "@/lib/requests/storage";
import { notFoundResponse, privateJson } from "@/lib/requests/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const result = await getTrackingRequest((await params).token);
    return result ? privateJson(result) : notFoundResponse();
  } catch {
    return privateJson({ error: "Le suivi est temporairement indisponible." }, 500);
  }
}
