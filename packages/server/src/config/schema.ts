import Type from "typebox";
import Schema from "typebox/schema";

// Every object is strict: unknown settings are rejected, never ignored.
const strict = { additionalProperties: false };

const integer = (minimum: number, maximum: number) => Type.Integer({ minimum, maximum });
const text = (maxLength: number) => Type.String({ minLength: 1, maxLength });

// The bounds below are provisional and will be revisited with real measurements.
const configSchema = Type.Object(
  {
    server: Type.Optional(
      Type.Object(
        {
          host: Type.Optional(text(45)),
          port: Type.Optional(integer(1, 65535)),
          allowedOrigins: Type.Optional(Type.Array(text(200), { maxItems: 20 })),
          trustedProxies: Type.Optional(Type.Array(text(45), { maxItems: 20 })),
        },
        strict,
      ),
    ),
    limits: Type.Optional(
      Type.Object(
        {
          maxMessageChars: Type.Optional(integer(1, 4000)),
          maxHistoryTurns: Type.Optional(integer(0, 20)),
          maxOutputTokens: Type.Optional(integer(1, 2048)),
          requestTimeoutMs: Type.Optional(integer(1000, 600000)),
          maxConcurrentInferences: Type.Optional(integer(1, 16)),
          maxQueueLength: Type.Optional(integer(0, 1000)),
          rateLimit: Type.Optional(
            Type.Object(
              {
                windowMs: Type.Optional(integer(1000, 3600000)),
                maxRequests: Type.Optional(integer(1, 10000)),
              },
              strict,
            ),
          ),
        },
        strict,
      ),
    ),
    knowledge: Type.Object(
      {
        faqPath: text(1024),
        documentsDir: Type.Optional(text(1024)),
        maxDocumentBytes: Type.Optional(integer(1024, 10485760)),
        fallbackMessage: Type.Optional(text(500)),
      },
      strict,
    ),
    inference: Type.Object(
      {
        llamaServerUrl: Type.Optional(text(200)),
        modelPath: text(1024),
        modelSha256: Type.Optional(text(128)),
        contextSize: Type.Optional(integer(256, 32768)),
      },
      strict,
    ),
    logging: Type.Optional(
      Type.Object(
        {
          logLevel: Type.Optional(
            Type.Union([
              Type.Literal("error"),
              Type.Literal("warn"),
              Type.Literal("info"),
              Type.Literal("debug"),
            ]),
          ),
          logMessageContent: Type.Optional(Type.Boolean()),
          retentionDays: Type.Optional(integer(0, 365)),
        },
        strict,
      ),
    ),
  },
  strict,
);

const validator = Schema.Compile(configSchema);

interface SchemaIssue {
  readonly keyword: string;
  readonly schemaPath: string;
  readonly instancePath: string;
  readonly params: Readonly<Record<string, unknown>>;
  readonly message: string;
}

// Names come from the input, so they are sanitized and truncated before being shown.
function safeName(name: string): string {
  return name.replace(/[^A-Za-z0-9_-]/g, "?").slice(0, 40);
}

function describePath(instancePath: string): string {
  const parts = instancePath.split("/").filter((part) => part !== "");
  return parts.length === 0 ? "configuration" : parts.map(safeName).join(".");
}

function listNames(value: unknown): string {
  return Array.isArray(value) ? value.map((item) => safeName(String(item))).join(", ") : "?";
}

// Messages never include the received values, only setting names and rules.
function describeIssue(issue: SchemaIssue): string | undefined {
  if (issue.keyword === "boolean") {
    return undefined;
  }
  if (issue.keyword === "const" && issue.schemaPath.includes("/anyOf/")) {
    return undefined;
  }
  const where = describePath(issue.instancePath);
  if (issue.keyword === "additionalProperties") {
    return `${where}: unknown setting(s): ${listNames(issue.params.additionalProperties)}`;
  }
  if (issue.keyword === "required") {
    return `${where}: missing required setting(s): ${listNames(issue.params.requiredProperties)}`;
  }
  if (issue.keyword === "anyOf") {
    return `${where}: has an unsupported value`;
  }
  return `${where}: ${issue.message}`;
}

// Returns an empty list when the input has the expected shape.
export function shapeErrors(input: unknown): readonly string[] {
  if (validator.Check(input)) {
    return [];
  }
  const [, issues] = validator.Errors(input);
  const messages = (issues as unknown as readonly SchemaIssue[])
    .map(describeIssue)
    .filter((message): message is string => message !== undefined);
  const unique = [...new Set(messages)].slice(0, 25);
  return unique.length > 0 ? unique : ["configuration: is not valid"];
}
