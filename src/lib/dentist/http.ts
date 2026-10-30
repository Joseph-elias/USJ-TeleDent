import "server-only";

export function isLocalOrigin(request: Request) {
  const expected = new URL(request.url);
  const host = request.headers.get("host");
  if (host) expected.host = host;
  if (isHttps(request)) expected.protocol = "https:";
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  // Native form POSTs can send a null Origin under our no-referrer policy.
  // In that case require the browser's same-origin Fetch Metadata instead.
  if (origin === null || origin === "null") return site === "same-origin";
  return origin === expected.origin && site !== "cross-site";
}

export function isHttps(request: Request) {
  return new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https";
}

export function sessionCookieOptions(request: Request) {
  return { httpOnly: true, sameSite: "strict" as const, secure: isHttps(request), path: "/" };
}

export async function readLogin(request: Request): Promise<{ email: string; password: string } | null> {
  if (!request.body || !request.headers.get("content-type")?.startsWith("application/json")) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (typeof value.email !== "string" || typeof value.password !== "string" ||
      !value.email.trim() || value.email.length > 254 || !value.password || value.password.length > 256) return null;
    return { email: value.email, password: value.password };
  } catch { return null; }
  finally { reader.releaseLock(); }
}
