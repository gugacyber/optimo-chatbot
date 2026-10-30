// Toolchain smoke test. Remove it once real tests exist.
import assert from "node:assert/strict";
import { test } from "node:test";

test("toolchain: Node.js runs TypeScript files directly", () => {
  const answer: number = 21 * 2;
  assert.equal(answer, 42);
});

test("toolchain: runtime meets the minimum Node.js major version", () => {
  const major = Number(process.versions.node.split(".")[0]);
  assert.ok(major >= 22);
});
