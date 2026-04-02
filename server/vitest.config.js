/**
 * vitest.config.js — Trackeo backend test runner
 * Tests live in server/__tests__/ and core/__tests__/
 * CommonJS modules (require/module.exports) are supported natively.
 */
const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    include: [
      '__tests__/**/*.test.js',
      '../core/**/__tests__/**/*.test.js',
    ],
    globals: false,
    // Force Vitest to process core/ through its own module runner
    // so that vi.mock() intercepts require() calls inside CJS modules.
    server: {
      deps: {
        inline: [/\/core\//],
      },
    },
  },
});
