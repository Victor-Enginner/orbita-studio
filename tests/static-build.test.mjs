import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildStatic, STATIC_FILES } from "../scripts/build-static.mjs";

test("public package contains only runtime assets and works under a repository path", async t => {
  const output = await mkdtemp(path.join(os.tmpdir(), "orbita-build-test-"));
  t.after(() => rm(output, { recursive: true, force: true }));
  await buildStatic(output);
  const html = await readFile(path.join(output, "index.html"), "utf8");
  for (const [, asset] of html.matchAll(/(?:href|src)="([^"#]+\.(?:css|js))"/g)) {
    assert.ok(new URL(asset, "https://example.com/orbita-studio/").pathname.startsWith("/orbita-studio/"));
    await readFile(path.join(output, asset));
  }
  const files = await readdir(output, { recursive: true });
  assert.ok(!files.some(file => /node_modules|tests|package-lock|README|server\.mjs|\.env/.test(file)));
  for (const file of STATIC_FILES) assert.ok((await readFile(path.join(output, file))).length);
  await writeFile(path.join(output, "private-export.json"), "{}");
  await assert.rejects(buildStatic(output), /Arquivo inesperado/);
});
