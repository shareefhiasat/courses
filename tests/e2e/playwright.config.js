// Minimal Playwright configuration for E2E tests
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    storageState: 'storageState.json',
  },
  projects: [
    {
      name: 'Chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
