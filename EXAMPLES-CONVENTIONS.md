# Examples Convention — packages/ts

The single convention every `packages/ts/<pkg>/examples/` directory follows
(PRD 0003 R5). The sibling Python convention (`../py/EXAMPLES-CONVENTIONS.md`)
mirrors this one; divergences are listed there with their language reason.

## What an example is

A single self-contained, runnable `.mjs` file demonstrating one use case
through the package's **public entry points only** — imported by package name
(`@internal/figma-comments`), never via `src/` or relative paths into the
package. Examples run against **built output**, so build first:

```sh
make -C figma-api/v100/packages/ts build       # or: npm run build --workspace=<pkg>
```

## File naming (identical in all 11 packages)

Numbered by complexity, kebab-case, descriptive slug:

| File | Covers (PRD 0003 R2) |
| --- | --- |
| `01-setup-and-auth.mjs` | Client/SDK construction + authentication check |
| `02-<primary-read>.mjs` | The package's primary read operation |
| `03-<workflow>.mjs` | One realistic composite / domain-specific workflow |
| `04-error-handling.mjs` | Handling a failed call (typed errors) |
| `05-write-<op>.mjs` | One write operation — **write-capable packages only** (comments, dev-resources, variables, webhooks), opt-in gated |

Each directory also has an `examples/README.md` index: a table naming every
example, what it demonstrates, whether it is **read-only** or **mutating**,
and the environment variables it needs. The index links here for the
convention instead of restating it.

## Header comment (every example, first thing in the file)

```js
/**
 * <package> example NN — <title>
 *
 * What it does: <one or two sentences>
 * Mode:         read-only | MUTATING (requires FIGMA_EXAMPLES_ALLOW_WRITES=1)
 * Env vars:     FIGMA_TOKEN (required in live mode), FIGMA_FILE_KEY (required), ...
 * Offline:      FIGMA_EXAMPLES_OFFLINE=1 runs it with no token and no network
 * Run:          FIGMA_TOKEN=... FIGMA_FILE_KEY=... node examples/NN-<slug>.mjs
 */
```

## Environment variables (one vocabulary, all packages)

- `FIGMA_TOKEN` — **the** token variable. No other token name appears anywhere
  in examples (`FIGMA_API_TOKEN`, `FIGMA_ACCESS_TOKEN` etc. are forbidden).
- Ids come from env, never hardcoded: `FIGMA_FILE_KEY`, `FIGMA_TEAM_ID`,
  `FIGMA_NODE_ID`, `FIGMA_PROJECT_ID`, `FIGMA_WEBHOOK_ENDPOINT` (webhook
  endpoint URLs are always user-supplied, never a default).
- Mode knobs:
  - `FIGMA_EXAMPLES_OFFLINE=1` — offline mode: the example injects
    `FakeFigmaClient` from `@internal/figma-api-fetch` as the service/SDK
    `fetcher` and runs with zero network and no token.
  - `FIGMA_EXAMPLES_ALLOW_WRITES=1` — write opt-in: a mutating example run in
    live mode without it must refuse, say so, and exit non-zero. In offline
    mode writes only hit the injected fake, so no opt-in is needed (the
    example prints that the write was simulated).

## Behavior contract

- **Missing env:** in live mode, a missing required variable prints
  `Missing required environment variable: <NAME>` (plus the offline hint) and
  exits with code **2** — no stack trace, no unhandled rejection.
- **Exit codes:** `0` success · `1` runtime/API failure · `2` usage/env error
  (including a refused write).
- **Self-contained:** each file is readable top-to-bottom with no cross-file
  setup; tiny helpers (`requireEnv`, the offline fixture) are inlined per file.
- **Offline fixtures** are small inline literals (or `FakeFigmaClient` routes),
  realistic in shape but obviously fake in content (`example-file-key`,
  `offline@example.test`). Never a real file key, team id, or token.
- **No new dependencies:** examples use only Node built-ins and the workspace
  packages themselves.

## Verification (PRD 0003 R8)

One command, offline by default (no token, no network):

```sh
# every package (aggregate — the drift alarm):
make -C figma-api/v100/packages/ts examples

# one package:
make -C figma-api/v100/packages/ts examples-pkg PKG=comments
```

This runs `run-examples.mjs`, which executes every `examples/*.mjs` with
`FIGMA_EXAMPLES_OFFLINE=1` and exits `0` iff every example exits `0`.
Expected output: one `PASS <pkg>/examples/<file>` line per example and a final
`examples: N passed, 0 failed`. It assumes a prior `make build` (examples
import built `dist`/`lib` output).

Live-mode runs stay manual and per-example, exactly as each header documents.

## Special case: figma-fetch

`figma-fetch` is copy-protected (`CONVENTIONS.md`: "Do not modify
figma-fetch"). Its examples are **purely additive** — the `examples/`
directory and a README examples link are the only touches, per PRD 0003 D1.
