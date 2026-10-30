import assert from "node:assert/strict";
import { test } from "node:test";
import { parseConfig } from "../../src/config/index.ts";
import type { ServerConfig } from "../../src/config/index.ts";

type Bag = Record<string, unknown>;

const minimal = (): Bag => ({
  knowledge: { faqPath: "faq.json" },
  inference: { modelPath: "model.gguf" },
});
const withServer = (server: Bag): Bag => ({ ...minimal(), server });
const withLimits = (limits: Bag): Bag => ({ ...minimal(), limits });
const withLogging = (logging: Bag): Bag => ({ ...minimal(), logging });
const withInference = (values: Bag): Bag => ({
  ...minimal(),
  inference: { modelPath: "model.gguf", ...values },
});

function mustParse(input: unknown): ServerConfig {
  const result = parseConfig(input);
  if (!result.ok) {
    throw new Error(`expected a valid configuration, got: ${result.errors.join("; ")}`);
  }
  return result.config;
}

function mustFail(input: unknown): string {
  const result = parseConfig(input);
  if (result.ok) {
    throw new Error("expected an invalid configuration");
  }
  return result.errors.join("\n");
}

test("a minimal configuration applies conservative defaults", () => {
  const config = mustParse(minimal());
  assert.equal(config.server.host, "127.0.0.1");
  assert.equal(config.server.port, 8787);
  assert.deepEqual(config.server.allowedOrigins, []);
  assert.deepEqual(config.server.trustedProxies, []);
  assert.equal(config.limits.maxConcurrentInferences, 1);
  assert.equal(config.inference.llamaServerUrl, "http://127.0.0.1:8080");
  assert.equal(config.logging.logMessageContent, false);
  assert.equal(config.logging.logLevel, "info");
});

test("the parsed configuration is deeply frozen", () => {
  const config = mustParse(withServer({ allowedOrigins: ["https://example.com"] }));
  assert.ok(Object.isFrozen(config));
  assert.ok(Object.isFrozen(config.server));
  assert.ok(Object.isFrozen(config.server.allowedOrigins));
});

test("missing required sections are reported", () => {
  const errors = mustFail({});
  assert.match(errors, /knowledge/);
  assert.match(errors, /inference/);
});

test("missing required settings name the setting", () => {
  const errors = mustFail({ knowledge: {}, inference: {} });
  assert.match(errors, /faqPath/);
  assert.match(errors, /modelPath/);
});

for (const input of [null, [], "text", 42, true]) {
  test(`rejects a configuration that is not an object: ${JSON.stringify(input)}`, () => {
    assert.match(mustFail(input), /must be an object/);
  });
}

test("rejects an unknown top-level setting", () => {
  assert.match(mustFail({ ...minimal(), extra: 1 }), /extra/);
});

test("rejects an unknown nested setting", () => {
  assert.match(mustFail(withServer({ hots: "127.0.0.1" })), /hots/);
});

test("rejects an unknown rate limit setting", () => {
  assert.match(mustFail(withLimits({ rateLimit: { burst: 5 } })), /burst/);
});

test("treats a __proto__ key as an unknown setting and does not pollute prototypes", () => {
  const input = JSON.parse(
    '{"__proto__":{"polluted":true},"knowledge":{"faqPath":"a"},"inference":{"modelPath":"b"}}',
  );
  assert.match(mustFail(input), /unknown setting/);
  assert.equal(({} as Bag).polluted, undefined);
});

for (const host of ["127.0.0.1", "0.0.0.0", "::1"]) {
  test(`accepts the explicit server host ${host}`, () => {
    assert.equal(mustParse(withServer({ host })).server.host, host);
  });
}

for (const host of ["localhost", "example.com", "not an address", "999.1.1.1", ""]) {
  test(`rejects the server host ${JSON.stringify(host)}`, () => {
    assert.match(mustFail(withServer({ host })), /server\.host/);
  });
}

test("accepts exact origins", () => {
  const origins = ["https://example.com", "http://localhost:3000"];
  assert.deepEqual(
    mustParse(withServer({ allowedOrigins: origins })).server.allowedOrigins,
    origins,
  );
});

for (const origin of [
  "*",
  "null",
  "example.com",
  "https://example.com/",
  "https://example.com/path",
  "https://example.com:443",
  "ftp://example.com",
  "https://user:pw@example.com",
]) {
  test(`rejects the allowed origin ${JSON.stringify(origin)}`, () => {
    assert.match(mustFail(withServer({ allowedOrigins: [origin] })), /allowedOrigins\[0\]/);
  });
}

test("trusted proxies must be IP addresses", () => {
  assert.deepEqual(mustParse(withServer({ trustedProxies: ["10.0.0.1"] })).server.trustedProxies, [
    "10.0.0.1",
  ]);
  assert.match(mustFail(withServer({ trustedProxies: ["proxy.internal"] })), /trustedProxies/);
  assert.match(mustFail(withServer({ trustedProxies: ["10.0.0.0/8"] })), /trustedProxies/);
});

const acceptedUrls: ReadonlyArray<readonly [string, string]> = [
  ["http://127.0.0.1:8080", "http://127.0.0.1:8080"],
  ["http://127.0.0.1:8080/", "http://127.0.0.1:8080"],
  ["http://[::1]:8080", "http://[::1]:8080"],
];
for (const [input, expected] of acceptedUrls) {
  test(`accepts the loopback inference address ${input}`, () => {
    const config = mustParse(withInference({ llamaServerUrl: input }));
    assert.equal(config.inference.llamaServerUrl, expected);
  });
}

for (const url of [
  "http://localhost:8080",
  "http://0.0.0.0:8080",
  "http://127.0.0.2:8080",
  "http://192.168.0.5:8080",
  "http://127.0.0.1.evil.example:8080",
  "https://127.0.0.1:8080",
  "ftp://127.0.0.1:8080",
  "http://127.0.0.1:8080/v1",
  "http://127.0.0.1:8080/?x=1",
  "http://user:pw@127.0.0.1:8080",
  "not a url",
]) {
  test(`rejects the inference address ${JSON.stringify(url)}`, () => {
    assert.match(mustFail(withInference({ llamaServerUrl: url })), /llamaServerUrl/);
  });
}

const invalidLimits: ReadonlyArray<readonly [string, unknown]> = [
  ["maxConcurrentInferences", 0],
  ["maxConcurrentInferences", -1],
  ["maxConcurrentInferences", 1.5],
  ["maxConcurrentInferences", "1"],
  ["maxConcurrentInferences", 17],
  ["maxConcurrentInferences", null],
  ["maxMessageChars", 0],
  ["maxMessageChars", 4001],
  ["maxQueueLength", -1],
  ["maxOutputTokens", 0],
  ["maxOutputTokens", 2049],
  ["requestTimeoutMs", 999],
  ["maxHistoryTurns", 21],
];
for (const [name, value] of invalidLimits) {
  test(`rejects limits.${name} = ${JSON.stringify(value)}`, () => {
    assert.match(mustFail(withLimits({ [name]: value })), new RegExp(`limits\\.${name}`));
  });
}

test("accepts valid limits", () => {
  const config = mustParse(
    withLimits({ maxConcurrentInferences: 2, maxQueueLength: 0, maxHistoryTurns: 0 }),
  );
  assert.equal(config.limits.maxConcurrentInferences, 2);
  assert.equal(config.limits.maxQueueLength, 0);
  assert.equal(config.limits.maxHistoryTurns, 0);
});

test("normalizes the model checksum to lowercase", () => {
  const upper = "ABCDEF0123456789".repeat(4);
  const config = mustParse(withInference({ modelSha256: upper }));
  assert.equal(config.inference.modelSha256, upper.toLowerCase());
});

for (const hash of ["a".repeat(63), "a".repeat(65), "g".repeat(64)]) {
  test(`rejects the model checksum ${JSON.stringify(hash)}`, () => {
    assert.match(mustFail(withInference({ modelSha256: hash })), /modelSha256/);
  });
}

test("rejects null bytes in paths", () => {
  assert.match(mustFail({ ...minimal(), knowledge: { faqPath: "a\0b" } }), /null bytes/);
});

test("validates logging settings", () => {
  assert.equal(mustParse(withLogging({ logLevel: "debug" })).logging.logLevel, "debug");
  assert.equal(mustParse(withLogging({ logMessageContent: true })).logging.logMessageContent, true);
  assert.match(mustFail(withLogging({ logLevel: "verbose" })), /logging\.logLevel/);
  assert.match(mustFail(withLogging({ logMessageContent: "yes" })), /logging\.logMessageContent/);
});

test("error messages never echo received values", () => {
  const input = {
    knowledge: { faqPath: "faq.json" },
    server: { host: "secret123", allowedOrigins: ["https://user:secret123@example.com"] },
    inference: {
      modelPath: "model.gguf",
      llamaServerUrl: "http://user:secret123@127.0.0.1:8080",
      modelSha256: "secret123notahash",
    },
  };
  const errors = mustFail(input);
  assert.doesNotMatch(errors, /secret123/);
});
