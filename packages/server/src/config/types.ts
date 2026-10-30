export type LogLevel = "error" | "warn" | "info" | "debug";

export interface ServerConfig {
  readonly server: {
    readonly host: string;
    readonly port: number;
    readonly allowedOrigins: readonly string[];
    readonly trustedProxies: readonly string[];
  };
  readonly limits: {
    readonly maxMessageChars: number;
    readonly maxHistoryTurns: number;
    readonly maxOutputTokens: number;
    readonly requestTimeoutMs: number;
    readonly maxConcurrentInferences: number;
    readonly maxQueueLength: number;
    readonly rateLimit: {
      readonly windowMs: number;
      readonly maxRequests: number;
    };
  };
  readonly knowledge: {
    readonly faqPath: string;
    readonly documentsDir?: string;
    readonly maxDocumentBytes: number;
    readonly fallbackMessage: string;
  };
  readonly inference: {
    readonly llamaServerUrl: string;
    readonly modelPath: string;
    readonly modelSha256?: string;
    readonly contextSize: number;
  };
  readonly logging: {
    readonly logLevel: LogLevel;
    readonly logMessageContent: boolean;
    readonly retentionDays: number;
  };
}

export type ParseResult =
  | { readonly ok: true; readonly config: ServerConfig }
  | { readonly ok: false; readonly errors: readonly string[] };
