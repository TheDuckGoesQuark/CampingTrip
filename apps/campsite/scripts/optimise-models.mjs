#!/usr/bin/env node
// Draco needs a decoder at runtime, served from public/draco via DRACO_PATH.
// WebP is lossy, so an already-converted file is skipped — a second run would
// otherwise degrade it.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, renameSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MODELS = new URL("../public/models/", import.meta.url).pathname;
const WEBP_QUALITY = 80;
const force = process.argv.includes("--force");

const gltf = (...args) =>
  execFileSync("npx", ["gltf-transform", ...args], { stdio: ["ignore", "pipe", "pipe"] });

function hasWebp(file) {
  return readFileSync(file).subarray(0, 65536).includes("EXT_texture_webp");
}

const mb = (n) => (n / 1048576).toFixed(2) + " MB";
const tmp = mkdtempSync(join(tmpdir(), "glb-"));
let before = 0;
let after = 0;

for (const name of readdirSync(MODELS)
  .filter((f) => f.endsWith(".glb"))
  .toSorted()) {
  const file = join(MODELS, name);
  const size = statSync(file).size;
  before += size;

  if (hasWebp(file) && !force) {
    after += size;
    console.log(`${name.padEnd(42)} ${mb(size).padStart(9)}  (already optimised)`);
    continue;
  }

  const webp = join(tmp, "w-" + name);
  const draco = join(tmp, "d-" + name);
  gltf("webp", file, webp, "--quality", String(WEBP_QUALITY));
  gltf("draco", webp, draco);
  renameSync(draco, file);

  const now = statSync(file).size;
  after += now;
  console.log(`${name.padEnd(42)} ${mb(size).padStart(9)} → ${mb(now).padStart(9)}`);
}

console.log(`\ntotal${"".padEnd(37)} ${mb(before).padStart(9)} → ${mb(after).padStart(9)}`);
