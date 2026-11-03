import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function load(file) {
  const result = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", result)(name => {
    if (name === "./messages") return load("../src/lib/i18n/messages.ts");
    throw new Error(`Unexpected import ${name}`);
  }, loaded, loaded.exports);
  return loaded.exports;
}
const { messages } = load("../src/lib/i18n/messages.ts");
const { translate, validLocale, translateTitle, dateLocales, speechLocales } = load("../src/lib/i18n/shared.ts");
const { reasons, departments, identityFields, steps, purposes } = load("../src/components/patient/patient-data.ts");

test("all three locales have valid direction-independent identifiers and fallback", () => {
  assert.equal(validLocale("ar"), "ar");
  assert.equal(validLocale("en"), "en");
  assert.equal(validLocale("fr"), "fr");
  assert.equal(validLocale("<script>"), "fr");
  assert.equal(validLocale(undefined), "fr");
  assert.equal(dateLocales.ar, "ar-LB");
  assert.equal(speechLocales.en, "en-US");
});

test("every patient question, option, service, identity field and step has English and Arabic text", () => {
  const sources = [...departments, ...steps, ...identityFields.map(field => field.label), ...purposes.flatMap(item => [item.title, item.text]), ...reasons.flatMap(reason => [reason.label, ...reason.questions.flatMap(question => [question.label, ...(question.options ?? [])])])];
  for (const source of sources.filter(value => !/^\d+$/u.test(value))) {
    assert.ok(messages[source]?.en, `Missing English: ${source}`);
    assert.ok(messages[source]?.ar, `Missing Arabic: ${source}`);
  }
  assert.equal(departments[2], "Endodontie", "stored department identifiers remain canonical");
  assert.equal(reasons.find(reason => reason.id === "swelling").questions[1].options[0], "Oui", "stored option values remain canonical");
});

test("translations preserve interpolation values, unknown text, whitespace and numeric identifiers", () => {
  assert.equal(translate("en", "Étape {0} sur {1} · {2}", [2, 6, "Reason"]), "Step 2 of 6 · Reason");
  assert.equal(translate("ar", "Photo jointe {0}", [3]), "الصورة المرفقة 3");
  assert.equal(translate("en", "  Continuer "), "  Continue ");
  assert.equal(translate("ar", "USJ-0123456789"), "USJ-0123456789");
  assert.equal(translate("en", "Patient’s original description"), "Patient’s original description");
  assert.equal(translate("en", undefined), "");
  assert.equal(translate("fr", "Continuer"), "Continuer");
});

test("server validation and photo errors localize their dynamic parameters", () => {
  assert.equal(translate("en", "Nom et prénom : saisissez une valeur valide (maximum 200 caractères)."), "Full name: enter a valid value (maximum 200 characters).");
  assert.equal(translate("en", "photo.png : cette photo est vide."), "photo.png: this photo is empty.");
  assert.equal(translate("en", "photo.png : cette photo est vide.\nother.png : cette photo dépasse 5 Mo."), "photo.png: this photo is empty.\nother.png: this photo exceeds 5 MB.");
});

test("page titles switch from an already translated language and all placeholders are retained", () => {
  assert.equal(translateTitle("ar", "Dentist dashboard | USJ TeleDent"), "لوحة تحكم طبيب الأسنان | USJ TeleDent");
  assert.equal(translateTitle("fr", "بوابة المريض | USJ TeleDent"), "Espace patient | USJ TeleDent");
  for (const [source, translations] of Object.entries(messages)) {
    const tokens = source.match(/\{\d+\}/gu) ?? [];
    for (const text of Object.values(translations)) assert.deepEqual(text.match(/\{\d+\}/gu) ?? [], tokens, source);
  }
});
