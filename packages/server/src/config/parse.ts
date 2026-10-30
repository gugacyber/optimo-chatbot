import { isIP } from "node:net";
import { shapeErrors } from "./schema.ts";
import type { LogLevel, ParseResult, ServerConfig } from "./types.ts";

type Bag = Readonly<Record<string, unknown>>;

// Provisional, conservative defaults. They have not been measured yet.
const DEFAULT_FALLBACK_MESSAGE =
  "I could not find enough information to answer that. Please contact us directly.";

function isRecord(value: unknown): value is Bag {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function own(bag: Bag, key: string): unknown {
  return Object.hasOwn(bag, key) ? bag[key] : undefined;
}

function section(bag: Bag, key: string): Bag {
  const value = own(bag, key);
  return isRecord(value) ? value : {};
}

function num(bag: Bag, key: string, fallback: number): number {
  const value = own(bag, key);
  return typeof value === "number" ? value : fallback;
}

function bool(bag: Bag, key: string, fallback: boolean): boolean {
  const value = own(bag, key);
  return typeof value === "boolean" ? value : fallback;
}

function text(bag: Bag, key: string, fallback: string): string {
  const value = own(bag, key);
  return typeof value === "string" ? value : fallback;
}

function optionalText(bag: Bag, key: string): string | undefined {
  const value = own(bag, key);
  return typeof value === "string" ? value : undefined;
}

function textList(bag: Bag, key: string): string[] {
  const value = own(bag, key);
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isLogLevel(value: unknown): value is LogLevel {
  return value === "error" || value === "warn" || value === "info" || value === "debug";
}

// An origin must be written exactly as browsers send it: scheme, host and optional port.
function isExactOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.origin === value;
  } catch {
    return false;
  }
}

// Only the loopback addresses 127.0.0.1 and [::1] are accepted for the inference server.
function normalizeLoopbackUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    const loopback = url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    const plain =
      url.protocol === "http:" &&
      url.username === "" &&
      url.password === "" &&
      url.pathname === "/" &&
      url.search === "" &&
      url.hash === "";
    return loopback && plain ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

export function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

// Validates a parsed configuration object. It never throws and never echoes received values.
export function parseConfig(input: unknown): ParseResult {
  if (!isRecord(input)) {
    return { ok: false, errors: ["configuration: must be an object"] };
  }
  const shape = shapeErrors(input);
  if (shape.length > 0) {
    return { ok: false, errors: shape };
  }

  const server = section(input, "server");
  const limits = section(input, "limits");
  const rateLimit = section(limits, "rateLimit");
  const knowledge = section(input, "knowledge");
  const inference = section(input, "inference");
  const logging = section(input, "logging");
  const errors: string[] = [];

  const host = text(server, "host", "127.0.0.1");
  if (isIP(host) === 0) {
    errors.push("server.host: must be an IP address");
  }

  const allowedOrigins = textList(server, "allowedOrigins");
  for (const [index, origin] of allowedOrigins.entries()) {
    if (!isExactOrigin(origin)) {
      errors.push(
        `server.allowedOrigins[${index}]: must be an exact origin such as https://example.com`,
      );
    }
  }

  const trustedProxies = textList(server, "trustedProxies");
  for (const [index, proxy] of trustedProxies.entries()) {
    if (isIP(proxy) === 0) {
      errors.push(`server.trustedProxies[${index}]: must be an IP address`);
    }
  }

  const faqPath = text(knowledge, "faqPath", "");
  const documentsDir = optionalText(knowledge, "documentsDir");
  const modelPath = text(inference, "modelPath", "");
  const paths = [
    ["knowledge.faqPath", faqPath],
    ["knowledge.documentsDir", documentsDir ?? ""],
    ["inference.modelPath", modelPath],
  ] as const;
  for (const [name, value] of paths) {
    if (value.includes("\0")) {
      errors.push(`${name}: must not contain null bytes`);
    }
  }

  const llamaServerUrl = normalizeLoopbackUrl(
    text(inference, "llamaServerUrl", "http://127.0.0.1:8080"),
  );
  if (llamaServerUrl === undefined) {
    errors.push(
      "inference.llamaServerUrl: must be http://127.0.0.1 or http://[::1] with a port, without credentials or a path",
    );
  }

  const requestedHash = optionalText(inference, "modelSha256");
  let modelSha256: string | undefined;
  if (requestedHash !== undefined) {
    if (/^[0-9a-fA-F]{64}$/.test(requestedHash)) {
      modelSha256 = requestedHash.toLowerCase();
    } else {
      errors.push("inference.modelSha256: must be 64 hexadecimal characters");
    }
  }

  if (errors.length > 0 || llamaServerUrl === undefined) {
    return { ok: false, errors };
  }

  const level = own(logging, "logLevel");
  const config: ServerConfig = {
    server: {
      host,
      port: num(server, "port", 8787),
      allowedOrigins,
      trustedProxies,
    },
    limits: {
      maxMessageChars: num(limits, "maxMessageChars", 500),
      maxHistoryTurns: num(limits, "maxHistoryTurns", 4),
      maxOutputTokens: num(limits, "maxOutputTokens", 256),
      requestTimeoutMs: num(limits, "requestTimeoutMs", 60000),
      maxConcurrentInferences: num(limits, "maxConcurrentInferences", 1),
      maxQueueLength: num(limits, "maxQueueLength", 2),
      rateLimit: {
        windowMs: num(rateLimit, "windowMs", 60000),
        maxRequests: num(rateLimit, "maxRequests", 20),
      },
    },
    knowledge: {
      faqPath,
      ...(documentsDir === undefined ? {} : { documentsDir }),
      maxDocumentBytes: num(knowledge, "maxDocumentBytes", 1048576),
      fallbackMessage: text(knowledge, "fallbackMessage", DEFAULT_FALLBACK_MESSAGE),
    },
    inference: {
      llamaServerUrl,
      modelPath,
      ...(modelSha256 === undefined ? {} : { modelSha256 }),
      contextSize: num(inference, "contextSize", 2048),
    },
    logging: {
      logLevel: isLogLevel(level) ? level : "info",
      logMessageContent: bool(logging, "logMessageContent", false),
      retentionDays: num(logging, "retentionDays", 7),
    },
  };
  return { ok: true, config: deepFreeze(config) };
}
