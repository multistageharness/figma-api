/**
 * StrykerJS mutation testing for one workspace package at a time:
 *
 *   MUTATE_PKG=comments npx stryker run      (or: npm run test:mutation -- comments)
 *
 * Tests import BUILT output, so Stryker mutates `src/**\/*.ts`, rebuilds the
 * instrumented source into `dist/` (buildCommand), and runs the package's own
 * Jest suite against it. Every mutant is compiled in once and switched at run
 * time, so a package takes seconds to a few minutes.
 *
 * `break` holds each package's floor: a run whose score drops below it fails.
 * Raise a floor when tests improve; never lower one to make a run pass.
 */

const pkg = process.env.MUTATE_PKG;
if (!pkg) {
  throw new Error(
    "Set MUTATE_PKG to a workspace directory, e.g. MUTATE_PKG=comments",
  );
}

/** Mutation-score floors (whole percent): first measured run (2026-11-19) minus 1 for noise. */
export const FLOORS = {
  comments: 44,
  components: 18,
  "dev-resources": 46,
  "figma-fetch": 38,
  "figma-fetch-file": 56,
  files: 37,
  "library-analytics": 40,
  projects: 35,
  variables: 36,
  webhooks: 25,
};

if (!(pkg in FLOORS)) {
  throw new Error(
    `No mutation config for "${pkg}". Known: ${Object.keys(FLOORS).join(", ")}` +
      " (sdk has no unit-tested source of its own: it only re-exports).",
  );
}

export default {
  packageManager: "npm",
  testRunner: "jest",
  jest: {
    configFile: `${pkg}/jest.config.mjs`,
    projectType: "custom",
    // Tests import dist/, not the mutated .ts, so Jest can't relate them.
    enableFindRelatedTests: false,
  },
  testRunnerNodeArgs: ["--experimental-vm-modules"],
  mutate: [
    `${pkg}/src/**/*.ts`,
    // Not unit-tested by design: CLIs and health servers are covered by
    // tests/integration; testing rails and type-only modules have no logic.
    `!${pkg}/src/**/cli.ts`,
    `!${pkg}/src/**/health-check-server.ts`,
    `!${pkg}/src/testing/**`,
    `!${pkg}/src/types.ts`,
    `!${pkg}/src/types/**`,
    `!${pkg}/src/**/*.d.ts`,
  ],
  buildCommand: `npm run build --workspace=${pkg}`,
  coverageAnalysis: "perTest",
  // Only this package's build is regenerated; siblings' dist/ is what its tests import.
  ignorePatterns: [
    `${pkg}/dist`,
    `${pkg}/lib`,
    "coverage",
    "reports",
    ".stryker-tmp",
  ],
  tempDirName: ".stryker-tmp",
  cleanTempDir: "always",
  reporters: ["clear-text", "progress", "html", "json"],
  htmlReporter: { fileName: `reports/mutation/${pkg}.html` },
  jsonReporter: { fileName: `reports/mutation/${pkg}.json` },
  thresholds: { high: 80, low: 60, break: FLOORS[pkg] || null },
  timeoutMS: 10_000,
};
