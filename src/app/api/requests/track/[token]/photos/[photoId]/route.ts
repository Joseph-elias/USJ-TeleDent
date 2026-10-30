import { getTrackingPhoto } from "@/lib/requests/storage";
import { notFoundResponse, privateHeaders, privateJson } from "@/lib/requests/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string; photoId: string }> }) {
  try {
    const { token, photoId } = await params;
    const photo = await getTrackingPhoto(token, photoId);
    if (!photo) return notFoundResponse();
    return new Response(new Uint8Array(photo.bytes), {
      headers: { ...privateHeaders, "Content-Type": photo.contentType, "Content-Disposition": "inline" },
    });
  } catch { return privateJson({ error: "La photo est temporairement indisponible." }, 500); }
}
