#!/usr/bin/env node
/**
 * Offline examples verifier for the packages/ts workspace (PRD 0003 R8).
 *
 * Runs every `<pkg>/examples/*.mjs` with FIGMA_EXAMPLES_OFFLINE=1 — no token,
 * no network — and exits 0 iff every example exits 0. Assumes a prior build
 * (`make build`): examples import the packages' built dist/lib output.
 *
 * Usage:
 *   node run-examples.mjs              # all workspace packages
 *   node run-examples.mjs comments …   # just the named package dirs
 *
 * Convention: EXAMPLES-CONVENTIONS.md. Invoked by `make examples` /
 * `make examples-pkg PKG=<dir>`.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

const workspaces = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
).workspaces;

const targets = process.argv.slice(2).length ? process.argv.slice(2) : workspaces;

const unknown = targets.filter((t) => !workspaces.includes(t));
if (unknown.length) {
  console.error(`Unknown package dir(s): ${unknown.join(", ")}`);
  console.error(`Workspace packages: ${workspaces.join(", ")}`);
  process.exit(2);
}

let passed = 0;
let failed = 0;
const missing = [];

for (const pkg of targets) {
  let files;
  try {
    files = readdirSync(join(root, pkg, "examples"))
      .filter((f) => f.endsWith(".mjs"))
      .sort();
  } catch {
    missing.push(pkg);
    continue;
  }
  for (const file of files) {
    const rel = `${pkg}/examples/${file}`;
    const res = spawnSync(process.execPath, [join("examples", file)], {
      cwd: join(root, pkg),
      env: { ...process.env, FIGMA_EXAMPLES_OFFLINE: "1" },
      encoding: "utf8",
      timeout: 60_000,
    });
    if (res.status === 0) {
      passed++;
      console.log(`PASS ${rel}`);
    } else {
      failed++;
      console.log(`FAIL ${rel} (exit ${res.status})`);
      const output = `${res.stdout ?? ""}${res.stderr ?? ""}`.trim();
      if (output) console.log(output.replace(/^/gm, "  | "));
    }
  }
}

if (missing.length) {
  console.log(`no examples/ directory: ${missing.join(", ")}`);
}
console.log(`examples: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 && passed > 0 ? 0 : 1);
