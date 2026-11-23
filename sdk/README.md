# `@internal/figma-sdk`

Every figma-api workspace package in one install — the way `lodash` relates to
`lodash.get`. It adds no code of its own: each package is re-exported unchanged,
under its own namespace and through its own subpath.

## Usage

```ts
// All packages, one namespace each
import { comments, figmaFetch, files } from "@internal/figma-sdk";
const fetcher = new figmaFetch.FigmaApiClient({ apiToken });
const commentsSdk = new comments.FigmaCommentsSDK({ fetcher });

// One package through its subpath (same module, same classes)
import FigmaCommentsSDK from "@internal/figma-sdk/comments";

// Or install only what you need
// npm i @internal/figma-comments
import FigmaCommentsSDK from "@internal/figma-comments";
```

| Subpath | Namespace | Package |
| --- | --- | --- |
| `./comments` | `comments` | `@internal/figma-comments` |
| `./components` | `components` | `@internal/figma-components-api` |
| `./dev-resources` | `devResources` | `@internal/figma-dev-resources` |
| `./figma-fetch` | `figmaFetch` | `@internal/figma-api-fetch` |
| `./figma-fetch-file` | `figmaFetchFile` | `@internal/figma-api-fetch-file` |
| `./files` | `files` | `@internal/figma-files-api` |
| `./find` | `find` | `@internal/figma-find-api` |
| `./library-analytics` | `libraryAnalytics` | `@internal/figma-library-analytics` |
| `./projects` | `projects` | `@internal/figma-projects` |
| `./variables` | `variables` | `@internal/figma-variables-sdk` |
| `./webhooks` | `webhooks` | `@internal/figma-webhooks` |

Namespaces are camelCased folder names. Subpaths re-export the package's
`default` too where it has one (`comments`, `components`, `files`,
`library-analytics`, `projects`, `variables`, `webhooks`). The root also exports
`PACKAGE_NAME` and `VERSION`, generated from `package.json` at build time.

## Notes

- **Namespaced, never flattened.** Most packages define their own
  `ValidationError`, `RateLimitError`, and so on. `comments.ValidationError` and
  `files.ValidationError` are different classes; catch through the namespace.
- **ESM only.** `@internal/figma-find-api` ships ESM only, so the umbrella does
  too. `require("@internal/figma-sdk")` is not supported; every individual
  package except `find` still ships a CommonJS build of its own.
- **Libraries only.** The CLIs (`figma-comments`, `figma-files`, …) come from
  installing the individual package.
- **Relationship to `@internal/figma-api`.** The workspace root is a private
  package with the same namespaces, for use inside this monorepo only. This
  package is the publishable one.
- **Keeping in step.** `tests/umbrella.test.mjs` fails when a workspace package
  is missing from `dependencies`, its version range is stale, or its subpath or
  namespace is absent. Adding a package means: a `dependencies` entry at
  `^<version>`, an `exports` subpath, `src/<pkg>.ts`, and a line in
  `src/index.ts`.

## Build and test

The umbrella re-exports the siblings' **built** output, so build the workspace
first:

```sh
make -C .. build        # figma-find engine, every workspace package, this one last
npm test                # the umbrella suite (Jest, against dist/)
make test               # the two steps above in one go
make examples           # run examples/ offline, no token needed
```
