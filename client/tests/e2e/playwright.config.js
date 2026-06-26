// Playwright configuration for E2E tests
import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './config/constants.js';

export default defineConfig({
  testDir: './specs',
  globalSetup: './global-setup.js',
  timeout: 60 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 8,
  outputDir: '../../test-results',
  reporter: [
    ['line'],
    ['html', { outputFolder: '../../test-results-html', open: 'never' }],
    ['json', { outputFile: '../../test-results/reports/results.json' }],
    ['junit', { outputFile: '../../test-results/reports/junit.xml' }],
    ['allure-playwright', { 
      outputFolder: '../../test-results/reports/allure-results',
      detail: true,
      suiteTitle: true,
    }],
    ['./reporters/linear-reporter.js', {
      teamKey: 'SHA',
      labels: ['qa', 'bug'],
      allureUrl: 'http://localhost:5050',
      dryRun: false,
    }]
  ],
  use: {
    baseURL: BASE_URL,
    headless: process.env.HEADED ? false : true,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ignoreHTTPSErrors: true },
    },
    // Uncomment for cross-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  // webServer disabled — dev server is expected to be running already
  // (HTTPS self-signed cert breaks Playwright's health check)
  // webServer: {
  //   command: 'npm run dev',
  //   url: BASE_URL,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 180 * 1000,
  // },
});
