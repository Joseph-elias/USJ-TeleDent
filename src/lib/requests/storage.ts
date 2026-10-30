import "server-only";

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { RequestValidationError } from "./validation";
import type { RequestInput, SavedRequest, SubmissionResult, TrackingRequest } from "./types";

const root = path.join(process.cwd(), ".local-data");
const requestDirectory = path.join(root, "requests");
const photoDirectory = path.join(root, "photos");
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const photoTypes: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};

function hasImageSignature(bytes: Buffer, type: string) {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (type === "image/png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return type === "image/webp" && bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
}

export async function saveRequest(input: RequestInput, files: File[]): Promise<SubmissionResult> {
  if (files.length > 3) throw new RequestValidationError("Vous pouvez joindre au maximum 3 photos.");
  // Validate every file before touching storage. Never trust the client MIME alone.
  const photos: { bytes: Buffer; content_type: string; extension: string }[] = [];
  for (const file of files) {
    if (!Object.hasOwn(photoTypes, file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) {
      throw new RequestValidationError("Chaque photo doit être au format JPEG, PNG ou WebP et ne pas dépasser 5 Mo.");
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!hasImageSignature(bytes, file.type)) throw new RequestValidationError("Le contenu d’une photo ne correspond pas à son format.");
    photos.push({ bytes, content_type: file.type, extension: photoTypes[file.type] });
  }

  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  const now = new Date().toISOString();
  const record: SavedRequest = {
    ...input, id, request_reference: `USJ-${id.replaceAll("-", "").toUpperCase()}`,
    status: "nouveau", priority: "normal", dentist_decision: null,
    dentist_response: null, proposed_appointment_at: null, call_video_details: null,
    tracking_token_hash: hashToken(token), created_at: now, updated_at: now,
    photos: photos.map((photo) => ({
      id: randomUUID(), request_id: id, storage_path: "",
      content_type: photo.content_type, size: photo.bytes.length, created_at: now,
    })),
  };
  record.photos.forEach((photo, index) => {
    photo.storage_path = `${id}/${photo.id}.${photos[index].extension}`;
  });

  await mkdir(requestDirectory, { recursive: true, mode: 0o700 });
  await mkdir(photoDirectory, { recursive: true, mode: 0o700 });
  const ownPhotoDirectory = path.join(photoDirectory, id);
  const temporaryRecord = path.join(requestDirectory, `.${id}.tmp`);
  try {
    if (photos.length) await mkdir(ownPhotoDirectory, { mode: 0o700 });
    for (let index = 0; index < photos.length; index++) {
      const file = await open(path.join(photoDirectory, record.photos[index].storage_path), "wx", 0o600);
      try { await file.writeFile(photos[index].bytes); await file.sync(); }
      finally { await file.close(); }
    }
    const file = await open(temporaryRecord, "wx", 0o600);
    try { await file.writeFile(JSON.stringify(record, null, 2), "utf8"); await file.sync(); }
    finally { await file.close(); }
    // Publish only after every photo and the full JSON are ready, on the same filesystem.
    await rename(temporaryRecord, path.join(requestDirectory, `${id}.json`));
  } catch (error) {
    await Promise.allSettled([
      rm(temporaryRecord, { force: true }),
      rm(ownPhotoDirectory, { recursive: true, force: true }),
    ]);
    throw error;
  }
  return { request_reference: record.request_reference, status: "nouveau", tracking_path: `/patient/track/${token}` };
}

async function findRequest(token: string): Promise<SavedRequest | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  let names: string[];
  try { names = await readdir(requestDirectory); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  const digest = Buffer.from(hashToken(token), "hex");
  // A scan is sufficient for the local prototype; no second index to keep in sync.
  for (const name of names) {
    if (!name.endsWith(".json") || !uuid.test(name.slice(0, -5))) continue;
    const record: SavedRequest = JSON.parse(await readFile(path.join(requestDirectory, name), "utf8"));
    if (typeof record.tracking_token_hash !== "string" || !/^[a-f0-9]{64}$/.test(record.tracking_token_hash)) continue;
    if (timingSafeEqual(digest, Buffer.from(record.tracking_token_hash, "hex"))) return record;
  }
  return null;
}

export async function getTrackingRequest(token: string): Promise<TrackingRequest | null> {
  const record = await findRequest(token);
  if (!record) return null;
  return {
    request_reference: record.request_reference, created_at: record.created_at,
    department: record.department, reason: record.reason, status: record.status,
    dentist_decision: record.dentist_decision, dentist_response: record.dentist_response, proposed_appointment_at: record.proposed_appointment_at,
    updated_at: record.updated_at,
    call_video_details: record.call_video_details, photos: record.photos.map(({ id }) => ({ id })),
  };
}

export async function getTrackingPhoto(token: string, photoId: string) {
  if (!uuid.test(photoId)) return null;
  const record = await findRequest(token);
  const photo = record?.photos.find((item) => item.id === photoId);
  if (!record || !photo || !uuid.test(record.id) || !Object.hasOwn(photoTypes, photo.content_type)) return null;
  const expectedPath = `${record.id}/${photoId}.${photoTypes[photo.content_type]}`;
  if (photo.storage_path !== expectedPath) return null;
  try { return { bytes: await readFile(path.join(photoDirectory, expectedPath)), contentType: photo.content_type }; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
