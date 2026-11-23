#!/usr/bin/env node
/**
 * Run mutation testing for the named workspace packages (default: all that
 * have a floor in stryker.config.mjs), one after another, then print one
 * summary row per package. Exits non-zero if any package falls below its
 * floor or Stryker fails. Assumes a prior build (`npm run build`), because each
 * package's tests import its siblings' dist/.
 *
 *   node scripts/mutation.mjs                 # every package
 *   node scripts/mutation.mjs comments files  # just these
 *
 * Reports: reports/mutation/<pkg>.html (open in a browser) and <pkg>.json.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// The config throws without MUTATE_PKG, so read the floor table by parsing it.
const configText = readFileSync(join(root, "stryker.config.mjs"), "utf8");
const floorBlock = configText.match(/FLOORS = \{([\s\S]*?)\};/)[1];
const floors = Object.fromEntries(
  [...floorBlock.matchAll(/"?([\w-]+)"?:\s*(\d+)/g)].map(([, k, v]) => [
    k,
    Number(v),
  ]),
);

const targets = process.argv.slice(2).length
  ? process.argv.slice(2)
  : Object.keys(floors);
const unknown = targets.filter((t) => !(t in floors));
if (unknown.length) {
  console.error(
    `Unknown package(s): ${unknown.join(", ")}. Known: ${Object.keys(floors).join(", ")}`,
  );
  process.exit(2);
}

const rows = [];
let failed = false;
for (const pkg of targets) {
  console.error(`\n=== mutation testing: ${pkg}`);
  const started = Date.now();
  const result = spawnSync("npx", ["stryker", "run", "stryker.config.mjs"], {
    cwd: root,
    env: { ...process.env, MUTATE_PKG: pkg },
    stdio: "inherit",
  });
  const seconds = Math.round((Date.now() - started) / 1000);
  let score = "error";
  try {
    const report = JSON.parse(
      readFileSync(join(root, `reports/mutation/${pkg}.json`), "utf8"),
    );
    score = scoreOf(report).toFixed(1);
  } catch {
    // Stryker failed before writing a report; the exit status says why.
  }
  if (result.status !== 0) failed = true;
  rows.push({
    pkg,
    score,
    floor: floors[pkg],
    seconds,
    ok: result.status === 0,
  });
}

console.log("\npackage            score   floor   time   result");
for (const r of rows) {
  console.log(
    `${r.pkg.padEnd(18)} ${String(r.score).padStart(5)}%  ${String(r.floor).padStart(4)}%  ${String(r.seconds).padStart(4)}s   ${r.ok ? "ok" : "FAIL"}`,
  );
}
process.exit(failed ? 1 : 0);

/** Mutation score over all mutants, as Stryker defines it (killed + timeout) / valid. */
function scoreOf(report) {
  let detected = 0;
  let valid = 0;
  for (const file of Object.values(report.files)) {
    for (const m of file.mutants) {
      if (
        m.status === "CompileError" ||
        m.status === "RuntimeError" ||
        m.status === "Ignored"
      )
        continue;
      valid += 1;
      if (m.status === "Killed" || m.status === "Timeout") detected += 1;
    }
  }
  return valid ? (100 * detected) / valid : 0;
}
