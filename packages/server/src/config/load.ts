import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { deepFreeze, parseConfig } from "./parse.ts";
import type { ParseResult, ServerConfig } from "./types.ts";

export const MAX_CONFIG_BYTES = 64 * 1024;

const fail = (message: string): ParseResult => ({ ok: false, errors: [message] });

// Relative paths in the file are resolved against the directory of the file itself.
function resolvePaths(config: ServerConfig, baseDir: string): ServerConfig {
  const { documentsDir } = config.knowledge;
  return deepFreeze({
    ...config,
    knowledge: {
      ...config.knowledge,
      faqPath: path.resolve(baseDir, config.knowledge.faqPath),
      ...(documentsDir === undefined ? {} : { documentsDir: path.resolve(baseDir, documentsDir) }),
    },
    inference: {
      ...config.inference,
      modelPath: path.resolve(baseDir, config.inference.modelPath),
    },
  });
}

// Error messages never include the content of the file or the received values.
export async function loadConfigFile(filePath: string): Promise<ParseResult> {
  const absolute = path.resolve(filePath);
  let content: string;
  try {
    const info = await stat(absolute);
    if (!info.isFile()) {
      return fail("configuration file: is not a regular file");
    }
    if (info.size > MAX_CONFIG_BYTES) {
      return fail("configuration file: is larger than 64 KiB");
    }
    content = await readFile(absolute, "utf8");
  } catch {
    return fail("configuration file: cannot be read");
  }
  if (Buffer.byteLength(content, "utf8") > MAX_CONFIG_BYTES) {
    return fail("configuration file: is larger than 64 KiB");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    return fail("configuration file: is not valid JSON");
  }

  const parsed = parseConfig(raw);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, config: resolvePaths(parsed.config, path.dirname(absolute)) };
}
