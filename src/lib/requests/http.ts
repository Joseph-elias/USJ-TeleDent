import "server-only";

export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
};

export function privateJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: privateHeaders });
}

export function notFoundResponse() {
  return privateJson({ error: "Demande introuvable." }, 404);
}

export class BodyTooLargeError extends Error {}

// Bound the real streamed body, even if Content-Length is absent or incorrect.
export async function readRequestForm(request: Request, limit = 16 * 1024 * 1024) {
  if (Number(request.headers.get("content-length")) > limit) throw new BodyTooLargeError();
  if (!request.body) throw new Error("Missing request body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new BodyTooLargeError(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return new Response(new Uint8Array(Buffer.concat(chunks)), {
    headers: { "Content-Type": request.headers.get("content-type") ?? "" },
  }).formData();
}
