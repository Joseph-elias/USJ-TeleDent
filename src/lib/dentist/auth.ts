import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, open, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { departments } from "@/components/patient/patient-data";
import { verifyPassword } from "./password.mjs";

type DentistAccount = {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  department: string;
};
export type Dentist = Omit<DentistAccount, "password_hash" | "email">;
type Session = { token_hash: string; dentist_id: string; created_at: string; expires_at: string };

const root = path.join(process.cwd(), ".local-data");
const sessionDirectory = path.join(root, "sessions");
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const validToken = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);
export const sessionDuration = 8 * 60 * 60;
export const sessionCookieName = "usj_dentist_session";

async function readAccounts(): Promise<DentistAccount[]> {
  let raw: string;
  try { raw = await readFile(path.join(root, "dentists.json"), "utf8"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
  const accounts: DentistAccount[] = JSON.parse(raw);
  if (!Array.isArray(accounts) || accounts.some((account) =>
    typeof account.id !== "string" || typeof account.full_name !== "string" ||
    typeof account.email !== "string" || typeof account.password_hash !== "string" ||
    !departments.some((department) => department === account.department))) {
    throw new Error("Invalid local dentist account file");
  }
  return accounts;
}

function publicDentist(account: DentistAccount): Dentist {
  return { id: account.id, full_name: account.full_name, department: account.department };
}

export async function authenticateDentist(email: string, password: string): Promise<Dentist | null> {
  const account = (await readAccounts()).find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
  // Perform the same costly operation for unknown emails; login errors stay generic.
  const dummy = `scrypt$131072$8$1$${"0".repeat(32)}$${"0".repeat(64)}`;
  const verified = await verifyPassword(password, account?.password_hash ?? dummy);
  return account && verified ? publicDentist(account) : null;
}

export async function createSession(dentistId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const session: Session = {
    token_hash: hash(token), dentist_id: dentistId,
    created_at: new Date(now).toISOString(), expires_at: new Date(now + sessionDuration * 1000).toISOString(),
  };
  await mkdir(sessionDirectory, { recursive: true, mode: 0o700 });
  const filename = path.join(sessionDirectory, `${session.token_hash}.json`);
  try {
    const file = await open(filename, "wx", 0o600);
    try { await file.writeFile(JSON.stringify(session, null, 2), "utf8"); await file.sync(); }
    finally { await file.close(); }
  } catch (error) { await rm(filename, { force: true }); throw error; }
  return { token, expiresAt: new Date(session.expires_at) };
}

export async function dentistForSession(token: string | undefined): Promise<Dentist | null> {
  if (!token || !validToken(token)) return null;
  const digest = hash(token);
  let session: Session;
  try { session = JSON.parse(await readFile(path.join(sessionDirectory, `${digest}.json`), "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  if (typeof session.token_hash !== "string" || !/^[a-f0-9]{64}$/.test(session.token_hash) ||
    !timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(session.token_hash, "hex"))) return null;
  const expiry = Date.parse(session.expires_at);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) return null;
  // Account removal or department changes take effect on the next request.
  const account = (await readAccounts()).find((item) => item.id === session.dentist_id);
  return account ? publicDentist(account) : null;
}

export async function destroySession(token: string | undefined) {
  if (token && validToken(token)) await rm(path.join(sessionDirectory, `${hash(token)}.json`), { force: true });
}
