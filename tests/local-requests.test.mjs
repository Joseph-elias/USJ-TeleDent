import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const workspace = process.cwd();
const require = createRequire(import.meta.url);
// Exercise the real TypeScript modules without adding a test framework. Stub
// only Next's server-only marker and, for the failure test, one filesystem call.
function load(relativePath, filesystem = fs) {
  const filename = path.join(workspace, relativePath);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  function resolve(id) {
    if (id === "server-only") return {};
    if (id === "node:fs/promises") return filesystem;
    if (id === "./validation") return load("src/lib/requests/validation.ts");
    if (id === "./routing") return load("src/lib/requests/routing.ts");
    if (id.startsWith("@/lib/requests/")) return load(`src/lib/requests/${id.split("/").at(-1)}.ts`, filesystem);
    if (id === "@/lib/dentist/http") return load("src/lib/dentist/http.ts", filesystem);
    if (id === "@/components/patient/patient-data") return load("src/components/patient/patient-data.ts");
    return require(id);
  }
  new Function("require", "module", "exports", source)(resolve, loaded, loaded.exports);
  return loaded.exports;
}

const { validateRequest } = load("src/lib/requests/validation.ts");
const { getUrgency, routeRequest } = load("src/lib/requests/routing.ts");
const { careContexts, reasons } = load("src/components/patient/patient-data.ts");
const safetyAnswers = { emergency_signs: "Non", urgent_signs: "Non" };
const input = {
  patient_name: "Patient Fictif", patient_file_number: "TEST-LOCAL",
  date_of_birth: "1990-04-15", phone: "+961 70 123 456", email: null,
  reason: "pain", description: "Données entièrement fictives pour les tests.",
  symptom_answers: { ...safetyAnswers, care_context: careContexts.rootCanal, onset: "Hier", intensity: "0", pattern: "Intermittente", swelling: "Non" },
};
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
const photo = () => new File([png], "../../patient-name.png", { type: "image/png" });

async function isolated(run, filesystem = fs) {
  const parent = path.join(workspace, ".npm-cache");
  await fs.mkdir(parent, { recursive: true });
  const directory = await fs.mkdtemp(path.join(parent, "request-test-"));
  process.chdir(directory);
  try { await run(load("src/lib/requests/storage.ts", filesystem), directory); }
  finally {
    process.chdir(workspace);
    assert.ok(path.resolve(directory).startsWith(`${parent}${path.sep}request-test-`));
    await fs.rm(directory, { recursive: true, force: true });
  }
}

test("server validation covers all question sets, explicit uncertainty and invalid input", () => {
  for (const reason of reasons) {
    const answers = Object.fromEntries(reason.questions.map(q => [q.id, q.options?.at(-1) ?? "Je ne sais pas"]));
    assert.equal(validateRequest({ ...input, reason: reason.id, symptom_answers: answers }).reason, reason.id);
  }
  assert.equal(validateRequest(input).symptom_answers.intensity, "0");
  for (const change of [
    { patient_name: " " }, { patient_file_number: "" }, { date_of_birth: "2026-02-30" },
    { date_of_birth: "2099-01-01" }, { phone: "-----" }, { email: "invalid" },
    { reason: "invalid" }, { description: "" },
    { symptom_answers: {} }, { symptom_answers: { ...input.symptom_answers, intensity: "11" } },
    { symptom_answers: { ...input.symptom_answers, swelling: false } },
    { symptom_answers: { ...input.symptom_answers, unexpected: "Non" } },
  ]) assert.throws(() => validateRequest({ ...input, ...change }));
  const validated = validateRequest({ ...input, status: "accepte", priority: "urgent", department: "Parodontologie" });
  assert.equal(validated.status, undefined);
  assert.equal(validated.priority, undefined);
  assert.equal(validated.department, undefined);
});

test("structured answers route to all six services, with urgency taking precedence", () => {
  const route = (answers = {}, fields = {}) => routeRequest({
    ...input, ...fields, symptom_answers: { ...input.symptom_answers, ...answers },
  }, "2026-11-05");
  for (const [care_context, department] of [
    [careContexts.surgery, "Chirurgie bucco-dentaire"],
    [careContexts.gums, "Parodontologie"],
    [careContexts.rootCanal, "Endodontie"],
    [careContexts.restoration, "Dentisterie restauratrice / conjointe"],
    [careContexts.unknown, "Urgences"],
  ]) {
    assert.deepEqual(route({ care_context }), { department, priority: "normal" });
  }
  const child = { date_of_birth: "2008-11-06" };
  assert.equal(route({}, child).department, "Pédodontie");
  assert.equal(route({}, { date_of_birth: "2008-11-05" }).department, "Endodontie");
  for (const [reason, answers] of [
    ["consultation", { emergency_signs: "Oui" }],
    ["other", { urgent_signs: "Oui" }],
    ["swelling", { swallowing: "Oui" }],
    ["swelling", { fever: "Oui" }],
    ["bleeding", { persistent: "Oui" }],
    ["trauma", { tooth: "Oui" }],
    ["pain", { swelling: "Oui" }],
  ]) {
    assert.deepEqual(route(answers, { ...child, reason }), { department: "Urgences", priority: "high" });
  }
  assert.equal(getUrgency("swelling", { opening: "Oui", urgent_signs: "Oui" }), "immediate");
  assert.equal(getUrgency("pain", { intensity: "10", swelling: "Non" }), null);
  for (const [reason, answers] of [
    ["consultation", { urgent_signs: "Je ne sais pas" }],
    ["swelling", { increasing: "Non", fever: "Non" }],
    ["bleeding", { active: "Je ne sais pas", persistent: "Non" }],
    ["trauma", { tooth: "Non", bleeding: "Non" }],
    ["pain", { swelling: "Je ne sais pas" }],
    ["followup", { evolution: "Il s’aggrave" }],
    ["restoration", { pain: "Oui" }],
  ]) {
    assert.deepEqual(route(answers, { ...child, reason }), { department: "Urgences", priority: "normal" });
  }
  assert.equal(route({ pain: "Non" }, { reason: "restoration" }).department, "Dentisterie restauratrice / conjointe");
  assert.equal(route({ active: "Non", persistent: "Non", care_context: careContexts.gums }, { reason: "bleeding" }).department, "Parodontologie");
});

test("atomic local records, hashed capabilities, protected photos and independent requests", async () => {
  await isolated(async (storage, directory) => {
    const { POST } = load("src/app/api/requests/route.ts");
    async function submit(data, photos) {
      const body = new FormData();
      body.set("data", JSON.stringify(data));
      for (const image of photos) body.append("photos", image);
      const response = await POST(new Request("http://localhost/api/requests", { method: "POST", body }));
      assert.equal(response.status, 201);
      return response.json();
    }
    const [first, second] = await Promise.all([
      submit({ ...input, department: "Parodontologie", priority: "high" }, []),
      submit({
        ...input, department: "Endodontie", priority: "normal",
        symptom_answers: { ...input.symptom_answers, emergency_signs: "Oui" },
      }, [photo()]),
    ]);
    assert.notEqual(first.request_reference, second.request_reference);
    const names = await fs.readdir(path.join(directory, ".local-data/requests"));
    assert.equal(names.length, 2);
    assert.ok(names.every(name => /^[0-9a-f-]{36}\.json$/.test(name)));
    const token = second.tracking_path.split("/").at(-1);
    assert.match(token, /^[A-Za-z0-9_-]{43}$/);
    const records = await Promise.all(names.map(async name => JSON.parse(await fs.readFile(path.join(directory, ".local-data/requests", name), "utf8"))));
    const saved = records.find(record => record.request_reference === second.request_reference);
    assert.equal(saved.tracking_token_hash, createHash("sha256").update(token).digest("hex"));
    assert.equal(JSON.stringify(records).includes(token), false);
    assert.equal(saved.status, "nouveau"); assert.equal(saved.priority, "high");
    assert.equal(saved.department, "Urgences");
    const firstSaved = records.find(record => record.request_reference === first.request_reference);
    assert.equal(firstSaved.department, "Endodontie");
    assert.equal(firstSaved.priority, "normal");
    assert.equal(saved.dentist_response, null);
    assert.equal(saved.photos.length, 1);
    assert.equal(saved.photos[0].storage_path.includes("patient-name"), false);
    const tracking = await storage.getTrackingRequest(token);
    assert.equal(tracking.request_reference, second.request_reference);
    assert.equal(tracking.tracking_token_hash, undefined);
    assert.equal(tracking.patient_file_number, undefined);
    const image = await storage.getTrackingPhoto(token, saved.photos[0].id);
    assert.deepEqual(image.bytes, png);
    assert.equal(await storage.getTrackingPhoto(first.tracking_path.split("/").at(-1), saved.photos[0].id), null);
    assert.equal(await storage.getTrackingRequest("A".repeat(43)), null);
    assert.equal(await storage.getTrackingRequest(second.request_reference), null);
    assert.equal(await storage.getTrackingRequest("../../requests"), null);
    assert.equal(await storage.getTrackingPhoto(token, "../"), null);
  });
});

test("dossier autofill requires a valid browser cookie and matching identity", async () => {
  await isolated(async (_storage, directory) => {
    const { NextRequest } = require("next/server");
    const { POST: submit } = load("src/app/api/requests/route.ts");
    const { POST: lookup } = load("src/app/api/requests/dossier/route.ts");
    const url = "https://example.test/api/requests";
    function send(remember) {
      const body = new FormData();
      body.set("data", JSON.stringify({ ...input, remember_file_number: remember }));
      return submit(new Request(url, { method: "POST", body }));
    }
    async function find({ cookie, name = " patient  FICTIF ", birthDate = input.date_of_birth, origin = "https://example.test" } = {}) {
      const body = new FormData();
      body.set("name", name);
      body.set("birthDate", birthDate);
      const headers = { origin, ...(cookie && { cookie }) };
      const response = await lookup(new NextRequest(`${url}/dossier`, { method: "POST", body, headers }));
      assert.match(response.headers.get("cache-control"), /no-store/);
      return [response.status, (await response.json()).fileNumber];
    }
    assert.deepEqual(await find(), [200, null]);
    const response = await send(true);
    assert.equal(response.status, 201);
    const setCookie = response.headers.get("set-cookie");
    const [cookie, ...attributes] = setCookie.split("; ");
    for (const attribute of ["Path=/api/requests/dossier", "Max-Age=7776000", "Secure", "HttpOnly", "SameSite=strict"]) {
      assert.ok(attributes.includes(attribute), attribute);
    }
    const [id, token] = cookie.slice("usj_dossier=".length).split(".");
    assert.equal(JSON.stringify(await response.json()).includes(token), false);
    const filename = path.join(directory, ".local-data", "requests", `${id}.json`);
    const record = JSON.parse(await fs.readFile(filename, "utf8"));
    assert.equal(record.dossier_token_hash, createHash("sha256").update(token).digest("hex"));
    assert.notEqual(record.dossier_token_hash, record.tracking_token_hash);
    assert.deepEqual(await find({ cookie }), [200, input.patient_file_number]);
    assert.deepEqual(await find({ cookie, name: "Autre patient" }), [200, null]);
    assert.deepEqual(await find({ cookie, birthDate: "1990-04-16" }), [200, null]);
    assert.deepEqual(await find({ cookie: `usj_dossier=${id}.${"A".repeat(43)}` }), [200, null]);
    assert.deepEqual(await find({ cookie, origin: "https://other.example" }), [403, null]);
    const cleared = (await send(false)).headers.get("set-cookie").split("; ");
    assert.equal(cleared[0], "usj_dossier=");
    assert.ok(cleared.includes("Path=/api/requests/dossier"));
    assert.ok(cleared.includes("Max-Age=0"));
    await fs.writeFile(filename, JSON.stringify({ ...record, created_at: "2020-01-01T00:00:00.000Z" }));
    assert.deepEqual(await find({ cookie }), [200, null]);
  });
});

test("invalid photo size, count, MIME and signatures leave no saved data", async () => {
  await isolated(async (storage, directory) => {
    for (const files of [
      [photo(), photo(), photo(), photo()],
      [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" })],
      [new File([png], "wrong.txt", { type: "text/plain" })],
      [new File(["not a photo"], "spoofed.png", { type: "image/png" })],
      [new File([], "empty.png", { type: "image/png" })],
    ]) await assert.rejects(storage.saveRequest(validateRequest(input), files));
    await assert.rejects(fs.access(path.join(directory, ".local-data")));
  });
});

test("a commit failure removes staged JSON and every associated photo", async () => {
  let renameReached = false;
  await isolated(async (storage, directory) => {
    await assert.rejects(storage.saveRequest(validateRequest(input), [photo(), photo()]), /simulated commit failure/);
    assert.ok(renameReached);
    assert.deepEqual(await fs.readdir(path.join(directory, ".local-data/requests")), []);
    assert.deepEqual(await fs.readdir(path.join(directory, ".local-data/photos")), []);
  }, {
    ...fs,
    rename: async (source, destination) => {
      renameReached = true;
      assert.equal(path.dirname(source), path.dirname(destination));
      const record = JSON.parse(await fs.readFile(source, "utf8"));
      for (const image of record.photos) await fs.access(path.join(path.dirname(path.dirname(source)), "photos", image.storage_path));
      throw new Error("simulated commit failure");
    },
  });
});
