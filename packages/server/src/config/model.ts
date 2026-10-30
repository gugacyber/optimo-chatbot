import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import type { Stats } from "node:fs";
import { stat } from "node:fs/promises";
import type { ServerConfig } from "./types.ts";

export type ModelCheckResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

// Checks the model file on disk. It reads the file only when a checksum was configured.
export async function checkModelFile(config: ServerConfig): Promise<ModelCheckResult> {
  const { modelPath, modelSha256 } = config.inference;

  let info: Stats;
  try {
    info = await stat(modelPath);
  } catch {
    return { ok: false, error: "inference.modelPath: file does not exist or cannot be read" };
  }
  if (!info.isFile()) {
    return { ok: false, error: "inference.modelPath: is not a regular file" };
  }

  if (modelSha256 !== undefined) {
    let digest: string;
    try {
      digest = await sha256File(modelPath);
    } catch {
      return { ok: false, error: "inference.modelPath: could not be read to verify the checksum" };
    }
    if (digest !== modelSha256) {
      return { ok: false, error: "inference.modelSha256: does not match the model file" };
    }
  }
  return { ok: true };
}
