import { NextResponse } from "next/server";
import { destroySession, sessionCookieName } from "@/lib/dentist/auth";
import { currentDentistToken } from "@/lib/dentist/session";
import { isLocalOrigin, sessionCookieOptions } from "@/lib/dentist/http";
import { privateHeaders, privateJson } from "@/lib/requests/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isLocalOrigin(request)) return privateJson({ error: "Origine non autorisée." }, 403);
  try {
    await destroySession(await currentDentistToken());
    const response = new NextResponse(null, { status: 303, headers: { ...privateHeaders, Location: "/dentist/login" } });
    response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions(request), maxAge: 0, expires: new Date(0) });
    return response;
  } catch { return privateJson({ error: "Déconnexion impossible pour le moment. Réessayez." }, 500); }
}
