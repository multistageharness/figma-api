/**
 * @internal/figma-sdk — every figma-api workspace package in one install.
 *
 * Each package is re-exported under its own namespace, because their exports
 * overlap (most define their own `ValidationError`, `RateLimitError`, and so
 * on). This entry loads all ten; import a subpath such as
 * `@internal/figma-sdk/files` to load one, or install that package on its own
 * (`@internal/figma-files-api`) — the way `lodash` relates to `lodash.get`.
 */
export * as comments from "./comments.js";
export * as components from "./components.js";
export * as devResources from "./dev-resources.js";
export * as figmaFetch from "./figma-fetch.js";
export * as figmaFetchFile from "./figma-fetch-file.js";
export * as files from "./files.js";
export * as libraryAnalytics from "./library-analytics.js";
export * as projects from "./projects.js";
export * as variables from "./variables.js";
export { PACKAGE_NAME, VERSION } from "./version.js";
export * as webhooks from "./webhooks.js";
