import { NextResponse } from "next/server";
import { authenticateDentist, createSession, destroySession, sessionCookieName, sessionDuration } from "@/lib/dentist/auth";
import { currentDentistToken } from "@/lib/dentist/session";
import { isLocalOrigin, readLogin, sessionCookieOptions } from "@/lib/dentist/http";
import { privateHeaders, privateJson } from "@/lib/requests/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isLocalOrigin(request)) return privateJson({ error: "Origine non autorisée." }, 403);
  const credentials = await readLogin(request);
  if (!credentials) return privateJson({ error: "Saisissez un email et un mot de passe valides." }, 400);
  try {
    const dentist = await authenticateDentist(credentials.email, credentials.password);
    if (!dentist) return privateJson({ error: "Email ou mot de passe incorrect." }, 401);
    await destroySession(await currentDentistToken());
    const session = await createSession(dentist.id);
    const response = NextResponse.json({ success: true }, { headers: privateHeaders });
    response.cookies.set(sessionCookieName, session.token, {
      ...sessionCookieOptions(request), maxAge: sessionDuration, expires: session.expiresAt,
    });
    return response;
  } catch { return privateJson({ error: "Connexion temporairement indisponible. Vérifiez le serveur local." }, 500); }
}
