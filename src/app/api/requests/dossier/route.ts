import type { NextRequest } from "next/server";
import { isLocalOrigin } from "@/lib/dentist/http";
import { privateJson, readRequestForm } from "@/lib/requests/http";
import { dossierCookieName, getRememberedDossier } from "@/lib/requests/storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isLocalOrigin(request)) return privateJson({ fileNumber: null }, 403);
  const cookie = request.cookies.get(dossierCookieName)?.value;
  if (!cookie) return privateJson({ fileNumber: null });

  try {
    const form = await readRequestForm(request, 4096);
    const name = form.get("name");
    const birthDate = form.get("birthDate");
    if (typeof name !== "string" || !name.trim() || name.length > 200 ||
        typeof birthDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return privateJson({ fileNumber: null });
    }
    return privateJson({ fileNumber: await getRememberedDossier(cookie, name, birthDate) });
  } catch {
    return privateJson({ fileNumber: null });
  }
}
