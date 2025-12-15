import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Integration tests may be slow due to rate limiting
    testTimeout: 30000,
    // Run tests sequentially to respect API rate limits
    sequence: {
      concurrent: false,
    },
  },
});
