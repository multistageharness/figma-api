/**
 * @internal/figma-api — every workspace package behind one import.
 *
 * Packages are exposed as namespaces because their exports overlap (most of
 * them define their own `ValidationError`, `RateLimitError`, and so on). This
 * entry loads all ten; import a subpath such as `@internal/figma-api/files`
 * to load only one.
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
export * as webhooks from "./webhooks.js";
