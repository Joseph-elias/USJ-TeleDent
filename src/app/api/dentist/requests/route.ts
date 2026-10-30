import { loadDashboard } from "@/lib/dentist/dashboard";
import { currentDentistToken } from "@/lib/dentist/session";
import { privateJson } from "@/lib/requests/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const search = new URL(request.url).searchParams;
    const result = await loadDashboard(await currentDentistToken(), search.get("status"), search.get("priority"));
    return result ? privateJson(result) : privateJson({ error: "Connexion requise." }, 401);
  } catch { return privateJson({ error: "Les demandes sont temporairement indisponibles." }, 500); }
}
