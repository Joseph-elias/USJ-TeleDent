import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const output = ts.transpileModule(readFileSync(new URL("../src/lib/speech/dictation.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
new Function("module", "exports", output)(loaded, loaded.exports);
const { mergeDictation, createDictationSession, speechErrorMessage, speechConstructor } = loaded.exports;

class FakeRecognition {
  lang = ""; continuous = false; interimResults = false;
  onstart = null; onresult = null; onerror = null; onend = null;
  started = false; stopped = false; aborted = false;
  start() { this.started = true; this.onstart?.(); }
  stop() { this.stopped = true; }
  abort() { this.aborted = true; }
}
const segment = (transcript, isFinal) => ({ isFinal, 0: { transcript } });

test("dictation preserves typed content, respects limits, and supports Arabic and Unicode", () => {
  assert.deepEqual(mergeDictation("Douleur depuis hier.", " Je décris la situation. ", 4000), { value: "Douleur depuis hier. Je décris la situation.", truncated: false });
  assert.equal(mergeDictation("Texte\n", "suite", 50).value, "Texte\nsuite");
  assert.equal(mergeDictation("", "ألم في الأسنان", 500).value, "ألم في الأسنان");
  assert.deepEqual(mergeDictation("abc", "def", 5), { value: "abc d", truncated: true });
  assert.equal(mergeDictation("abc", "", 10).value, "abc");
  assert.equal(mergeDictation("", "a😀b", 2).value, "a");
});

test("recognition rebuilds final results without duplicating earlier segments and keeps interim text separate", () => {
  const engine = new FakeRecognition();
  const results = [];
  let started = 0, ended = 0;
  const session = createDictationSession(engine, {
    language: "fr-FR", onStart: () => started++, onEnd: () => ended++,
    onResult: (final, interim) => results.push([final, interim]), onError: () => assert.fail("unexpected error"),
  });
  session.start();
  assert.equal(started, 1);
  assert.equal(engine.lang, "fr-FR");
  assert.equal(engine.continuous, true);
  assert.equal(engine.interimResults, true);
  engine.onresult({ results: [segment("J’ai mal", true), segment("depuis", false)] });
  engine.onresult({ results: [segment("J’ai mal", true), segment("depuis hier", true)] });
  engine.onresult({ results: [segment("J’ai mal", true), segment("depuis hier", true)] });
  assert.deepEqual(results, [["J’ai mal", "depuis"], ["J’ai mal depuis hier", ""], ["J’ai mal depuis hier", ""]]);
  session.stop();
  // Late final results must still be accepted after stop, until end/disposal.
  engine.onresult({ results: [segment("Texte final", true)] });
  assert.deepEqual(results.at(-1), ["Texte final", ""]);
  engine.onend();
  assert.equal(ended, 1);
});

test("disposal releases the microphone and ignores late results and events", () => {
  const engine = new FakeRecognition();
  const session = createDictationSession(engine, {
    language: "ar-LB", onStart() {}, onResult() { assert.fail("late transcript"); },
    onError() { assert.fail("late error"); }, onEnd() { assert.fail("late end"); },
  });
  const lateResult = engine.onresult, lateError = engine.onerror, lateEnd = engine.onend;
  session.dispose();
  assert.equal(engine.aborted, true);
  assert.equal(engine.onresult, null);
  lateResult({ results: [segment("must not enter another field", true)] });
  lateError({ error: "network" });
  lateEnd();
});

test("permission, microphone, network and language errors have actionable typing fallbacks", () => {
  for (const error of ["not-allowed", "service-not-allowed", "audio-capture", "network", "no-speech", "language-not-supported", "unknown"]) {
    assert.match(speechErrorMessage(error), /saisi/);
  }
  const engine = new FakeRecognition();
  const errors = [];
  createDictationSession(engine, { language: "en-US", onStart() {}, onResult() {}, onEnd() {}, onError: text => errors.push(text) });
  engine.onerror({ error: "aborted" });
  assert.equal(errors.length, 0);
  engine.onerror({ error: "not-allowed" });
  assert.match(errors[0], /refusé/);
  assert.equal(speechConstructor(), undefined, "server rendering never accesses window");
});
