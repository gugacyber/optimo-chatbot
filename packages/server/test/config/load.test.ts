import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { loadConfigFile, MAX_CONFIG_BYTES } from "../../src/config/index.ts";
import type { ServerConfig } from "../../src/config/index.ts";

let dir = "";

before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "optimo-config-"));
});

after(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function mustLoad(file: string): Promise<ServerConfig> {
  const result = await loadConfigFile(file);
  if (!result.ok) {
    throw new Error(`expected a valid file, got: ${result.errors.join("; ")}`);
  }
  return result.config;
}

async function mustFailToLoad(file: string): Promise<string> {
  const result = await loadConfigFile(file);
  if (result.ok) {
    throw new Error("expected the file to be rejected");
  }
  return result.errors.join("\n");
}

test("loads a valid file and resolves relative paths against its directory", async () => {
  const file = path.join(dir, "valid.json");
  const absoluteModel = path.join(dir, "models", "m.gguf");
  await writeFile(
    file,
    JSON.stringify({
      knowledge: { faqPath: "data/faq.json", documentsDir: "docs" },
      inference: { modelPath: absoluteModel },
    }),
  );
  const config = await mustLoad(file);
  assert.equal(config.knowledge.faqPath, path.join(dir, "data", "faq.json"));
  assert.equal(config.knowledge.documentsDir, path.join(dir, "docs"));
  assert.equal(config.inference.modelPath, absoluteModel);
  assert.ok(Object.isFrozen(config));
});

test("resolves a relative model path against the file directory", async () => {
  const file = path.join(dir, "relative.json");
  await writeFile(
    file,
    JSON.stringify({ knowledge: { faqPath: "faq.json" }, inference: { modelPath: "m.gguf" } }),
  );
  const config = await mustLoad(file);
  assert.equal(config.inference.modelPath, path.join(dir, "m.gguf"));
});

test("rejects a file that does not exist", async () => {
  assert.match(await mustFailToLoad(path.join(dir, "missing.json")), /cannot be read/);
});

test("rejects a directory", async () => {
  assert.match(await mustFailToLoad(dir), /not a regular file/);
});

test("rejects invalid JSON without echoing its content", async () => {
  const file = path.join(dir, "invalid.json");
  await writeFile(file, '{ "secret123": ');
  const errors = await mustFailToLoad(file);
  assert.match(errors, /not valid JSON/);
  assert.doesNotMatch(errors, /secret123/);
});

test("rejects a file larger than the limit", async () => {
  const file = path.join(dir, "large.json");
  await writeFile(file, `{${" ".repeat(MAX_CONFIG_BYTES)}}`);
  assert.match(await mustFailToLoad(file), /larger than/);
});

test("reports validation errors found in the file", async () => {
  const file = path.join(dir, "unknown.json");
  await writeFile(
    file,
    JSON.stringify({
      knowledge: { faqPath: "faq.json" },
      inference: { modelPath: "m.gguf" },
      surprise: true,
    }),
  );
  assert.match(await mustFailToLoad(file), /surprise/);
});
