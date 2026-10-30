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
    if (id === "@/components/patient/patient-data") return load("src/components/patient/patient-data.ts");
    return require(id);
  }
  new Function("require", "module", "exports", source)(resolve, loaded, loaded.exports);
  return loaded.exports;
}

const { validateRequest } = load("src/lib/requests/validation.ts");
const { reasons } = load("src/components/patient/patient-data.ts");
const input = {
  patient_name: "Patient Fictif", patient_file_number: "TEST-LOCAL",
  date_of_birth: "1990-04-15", phone: "+961 70 123 456", email: null,
  reason: "pain", description: "Données entièrement fictives pour les tests.",
  symptom_answers: { onset: "Hier", intensity: "0", pattern: "Intermittente", swelling: "Je ne sais pas" },
  department: "Endodontie",
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
    { reason: "invalid" }, { department: "invalid" }, { description: "" },
    { symptom_answers: {} }, { symptom_answers: { ...input.symptom_answers, intensity: "11" } },
    { symptom_answers: { ...input.symptom_answers, swelling: false } },
    { symptom_answers: { ...input.symptom_answers, unexpected: "Non" } },
  ]) assert.throws(() => validateRequest({ ...input, ...change }));
  const validated = validateRequest({ ...input, status: "accepte", priority: "urgent" });
  assert.equal(validated.status, undefined);
  assert.equal(validated.priority, undefined);
});

test("atomic local records, hashed capabilities, protected photos and independent requests", async () => {
  await isolated(async (storage, directory) => {
    const [first, second] = await Promise.all([
      storage.saveRequest(validateRequest(input), []),
      storage.saveRequest(validateRequest(input), [photo()]),
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
    assert.equal(saved.status, "nouveau"); assert.equal(saved.priority, "normal");
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
