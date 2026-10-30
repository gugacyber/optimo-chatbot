import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { checkModelFile, parseConfig } from "../../src/config/index.ts";
import type { ServerConfig } from "../../src/config/index.ts";

const content = "tiny fake model file used only by tests";
const digest = createHash("sha256").update(content).digest("hex");

let dir = "";
let modelPath = "";

before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "optimo-model-"));
  modelPath = path.join(dir, "model.gguf");
  await writeFile(modelPath, content);
});

after(async () => {
  await rm(dir, { recursive: true, force: true });
});

function configFor(file: string, sha256?: string): ServerConfig {
  const result = parseConfig({
    knowledge: { faqPath: "faq.json" },
    inference: { modelPath: file, ...(sha256 === undefined ? {} : { modelSha256: sha256 }) },
  });
  if (!result.ok) {
    throw new Error(result.errors.join("; "));
  }
  return result.config;
}

test("accepts an existing model file when no checksum is configured", async () => {
  assert.deepEqual(await checkModelFile(configFor(modelPath)), { ok: true });
});

test("accepts a model file with a matching checksum", async () => {
  assert.deepEqual(await checkModelFile(configFor(modelPath, digest)), { ok: true });
});

test("accepts a matching checksum written in uppercase", async () => {
  assert.deepEqual(await checkModelFile(configFor(modelPath, digest.toUpperCase())), { ok: true });
});

test("rejects a model file with a different checksum without echoing hashes", async () => {
  const result = await checkModelFile(configFor(modelPath, "0".repeat(64)));
  assert.equal(result.ok, false);
  assert.match(JSON.stringify(result), /does not match/);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(digest));
});

test("rejects a model file that does not exist", async () => {
  const result = await checkModelFile(configFor(path.join(dir, "missing.gguf")));
  assert.equal(result.ok, false);
  assert.match(JSON.stringify(result), /does not exist/);
});

test("rejects a directory used as the model path", async () => {
  const result = await checkModelFile(configFor(dir));
  assert.equal(result.ok, false);
  assert.match(JSON.stringify(result), /regular file/);
});
