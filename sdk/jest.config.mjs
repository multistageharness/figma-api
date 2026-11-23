/**
 * Jest configuration for the figma-sdk umbrella package.
 * Extends the shared base; the suite imports the BUILT dist/ output through
 * the package's own name, exactly as a consumer would.
 */

import baseConfig from "../jest.base.config.mjs";

export default {
  ...baseConfig,
  displayName: "figma-sdk",
  testMatch: ["<rootDir>/tests/**/*.test.mjs"],
};
