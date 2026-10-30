import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import * as fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import ts from "typescript";
import * as passwords from "../src/lib/dentist/password.mjs";

const workspace = process.cwd();
const require = createRequire(import.meta.url);
function load(relativePath) {
  const output = ts.transpileModule(readFileSync(path.join(workspace, relativePath), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  function resolve(id) {
    if (id === "server-only") return {};
    if (id === "./password.mjs") return passwords;
    if (id === "./auth") return load("src/lib/dentist/auth.ts");
    if (id === "./filters") return load("src/lib/dentist/filters.ts");
    if (id === "@/components/patient/patient-data") return load("src/components/patient/patient-data.ts");
    return require(id);
  }
  new Function("require", "module", "exports", output)(resolve, loaded, loaded.exports);
  return loaded.exports;
}
async function isolated(run) {
  const cache = path.join(workspace, ".npm-cache");
  await fs.mkdir(cache, { recursive: true });
  const directory = await fs.mkdtemp(path.join(cache, "dentist-test-"));
  process.chdir(directory);
  try { await run(directory); }
  finally {
    process.chdir(workspace);
    assert.ok(path.resolve(directory).startsWith(`${cache}${path.sep}dentist-test-`));
    await fs.rm(directory, { recursive: true, force: true });
  }
}
const testPassword = "Fictional-unit-test-password-only";
let testHash;
async function accounts() {
  testHash ??= await passwords.hashPassword(testPassword);
  const data = [
    { id: randomUUID(), full_name: "Dentiste Endo Fictif", email: "endo@example.test", password_hash: testHash, department: "Endodontie" },
    { id: randomUUID(), full_name: "Dentiste Paro Fictif", email: "paro@example.test", password_hash: testHash, department: "Parodontologie" },
  ];
  await fs.mkdir(".local-data", { recursive: true });
  await fs.writeFile(".local-data/dentists.json", JSON.stringify(data));
  return data;
}

test("scrypt hashes are salted and verify without storing plaintext", async () => {
  const a = await passwords.hashPassword(testPassword);
  const b = await passwords.hashPassword(testPassword);
  assert.notEqual(a, b);
  assert.match(a, /^scrypt\$131072\$8\$1\$/);
  assert.equal(a.includes(testPassword), false);
  assert.equal(await passwords.verifyPassword(testPassword, a), true);
  assert.equal(await passwords.verifyPassword("incorrect", a), false);
  assert.equal(await passwords.verifyPassword(testPassword, "invalid hash"), false);
});

test("account generation creates six departments and never overwrites accounts or patients", async () => {
  await isolated(async (directory) => {
    await fs.mkdir(".local-data/requests", { recursive: true });
    await fs.writeFile(".local-data/requests/preserve.json", "FICTIONAL PRESERVED PATIENT");
    const run = () => promisify(execFile)(process.execPath, ["--experimental-strip-types", "--experimental-default-type=module", path.join(workspace, "scripts/create-dentists.mjs")], { cwd: directory });
    const result = await run();
    const raw = await fs.readFile(".local-data/dentists.json", "utf8");
    const data = JSON.parse(raw);
    const { departments } = load("src/components/patient/patient-data.ts");
    assert.deepEqual(data.map(item => item.department), [...departments]);
    assert.equal(new Set(data.map(item => item.id)).size, 6);
    const generated = [...result.stdout.matchAll(/Email : (.+)\r?\nMot de passe TEST : (.+)/g)];
    assert.equal(generated.length, 6);
    for (const [, email, password] of generated) {
      assert.equal(raw.includes(password), false);
      assert.equal(await passwords.verifyPassword(password, data.find(item => item.email === email).password_hash), true);
    }
    const again = await run();
    assert.equal(await fs.readFile(".local-data/dentists.json", "utf8"), raw);
    assert.equal(again.stdout.includes("Mot de passe TEST"), false);
    assert.equal(await fs.readFile(".local-data/requests/preserve.json", "utf8"), "FICTIONAL PRESERVED PATIENT");
  });
});

test("credentials, hashed sessions, expiration, current account lookup, and logout", async () => {
  await isolated(async () => {
    const data = await accounts();
    const auth = load("src/lib/dentist/auth.ts");
    assert.equal(await auth.dentistForSession(undefined), null);
    assert.equal(await auth.dentistForSession("../../dentists"), null);
    assert.equal(await auth.authenticateDentist(data[0].email, "incorrect"), null);
    assert.equal(await auth.authenticateDentist("missing@example.test", testPassword), null);
    const dentist = await auth.authenticateDentist(" ENDO@EXAMPLE.TEST ", testPassword);
    assert.equal(dentist.id, data[0].id);
    assert.equal(dentist.password_hash, undefined);
    const session = await auth.createSession(dentist.id);
    const digest = createHash("sha256").update(session.token).digest("hex");
    const filename = `.local-data/sessions/${digest}.json`;
    const raw = await fs.readFile(filename, "utf8");
    assert.equal(raw.includes(session.token), false);
    assert.equal(JSON.parse(raw).token_hash, digest);
    assert.equal((await auth.dentistForSession(session.token)).department, "Endodontie");
    data[0].department = "Parodontologie";
    await fs.writeFile(".local-data/dentists.json", JSON.stringify(data));
    assert.equal((await auth.dentistForSession(session.token)).department, "Parodontologie");
    const saved = JSON.parse(raw);
    await fs.writeFile(filename, JSON.stringify({ ...saved, expires_at: "2000-01-01T00:00:00Z" }));
    assert.equal(await auth.dentistForSession(session.token), null);
    await fs.writeFile(filename, raw);
    await auth.destroySession(session.token);
    assert.equal(await auth.dentistForSession(session.token), null);
    const second = await auth.createSession(dentist.id);
    await fs.writeFile(".local-data/dentists.json", "[]");
    assert.equal(await auth.dentistForSession(second.token), null);
  });
});

test("dashboard filters and counts are department-scoped and omit private fields", async () => {
  await isolated(async () => {
    const data = await accounts();
    const auth = load("src/lib/dentist/auth.ts");
    const { loadDashboard } = load("src/lib/dentist/dashboard.ts");
    await fs.mkdir(".local-data/requests");
    const states = [["nouveau", "normal"], ["en_cours", "high"], ["repondu", "normal"], ["cloture", "high"]];
    for (const [status, priority] of states) {
      const id = randomUUID();
      await fs.writeFile(`.local-data/requests/${id}.json`, JSON.stringify({
        id, request_reference: `TEST-${id}`, patient_name: "Patient Endo Fictif", reason: "pain", department: "Endodontie",
        created_at: "2026-10-30T08:00:00Z", status, priority, tracking_token_hash: "SECRET_TRACKING_SENTINEL",
        phone: "PRIVATE_PHONE_SENTINEL", symptom_answers: { private: "PRIVATE_CLINICAL_SENTINEL" },
      }));
    }
    const other = randomUUID();
    await fs.writeFile(`.local-data/requests/${other}.json`, JSON.stringify({
      id: other, request_reference: "OTHER_DEPARTMENT_SENTINEL", patient_name: "Patient Paro Fictif", reason: "pain",
      department: "Parodontologie", created_at: "2026-10-30T08:00:00Z", status: "nouveau", priority: "normal",
    }));
    const endo = await auth.createSession(data[0].id);
    const paro = await auth.createSession(data[1].id);
    assert.equal(await loadDashboard(undefined), null);
    const all = await loadDashboard(endo.token);
    assert.deepEqual(all.counts, { total: 4, nouveaux: 1, en_cours: 1, traites: 2 });
    assert.equal(all.requests.length, 4);
    for (const [status] of states) {
      const filtered = await loadDashboard(endo.token, status);
      assert.equal(filtered.requests.length, 1);
      assert.deepEqual(filtered.counts, all.counts);
    }
    assert.equal((await loadDashboard(endo.token, "all", "high")).requests.length, 2);
    assert.equal((await loadDashboard(endo.token, "all", "normal")).requests.length, 2);
    assert.equal((await loadDashboard(endo.token, "nouveau", "high")).requests.length, 0);
    assert.equal((await loadDashboard(endo.token, "invalid", "invalid")).requests.length, 4);
    const serialized = JSON.stringify(all);
    for (const sentinel of ["SECRET_TRACKING_SENTINEL", "PRIVATE_PHONE_SENTINEL", "PRIVATE_CLINICAL_SENTINEL", "OTHER_DEPARTMENT_SENTINEL", "password_hash", "token_hash"]) assert.equal(serialized.includes(sentinel), false);
    const otherDashboard = await loadDashboard(paro.token);
    assert.equal(otherDashboard.requests.length, 1);
    assert.equal(otherDashboard.requests[0].department, "Parodontologie");
  });
});

test("cookie options and login/logout origin checks", () => {
  const { isLocalOrigin, sessionCookieOptions } = load("src/lib/dentist/http.ts");
  const local = new Request("http://localhost:3000/api/dentist/login", { headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" } });
  assert.equal(isLocalOrigin(local), true);
  assert.deepEqual(sessionCookieOptions(local), { httpOnly: true, sameSite: "strict", secure: false, path: "/" });
  assert.equal(sessionCookieOptions(new Request("https://localhost/api/dentist/login")).secure, true);
  assert.equal(isLocalOrigin(new Request("http://localhost/api/dentist/login", { headers: { origin: "https://example.com" } })), false);
  assert.equal(isLocalOrigin(new Request("http://localhost/api/dentist/login")), false);
  assert.equal(isLocalOrigin(new Request("http://localhost/api/dentist/logout", { headers: { origin: "null", "sec-fetch-site": "same-origin" } })), true);
  assert.equal(isLocalOrigin(new Request("http://localhost/api/dentist/logout", { headers: { origin: "null", "sec-fetch-site": "cross-site" } })), false);
});
