// Root Playwright config — mirror of tests/e2e/playwright.config.js
// This ensures Playwright finds the config when run from client/ root
import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './tests/e2e/config/constants.js';

export default defineConfig({
  testDir: './tests/e2e/specs',
  timeout: 60 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 8,
  outputDir: './test-results',
  reporter: [
    ['line'],
    ['html', { outputFolder: './test-results/html-report', open: 'never' }],
    ['json', { outputFile: './test-results/reports/results.json' }],
    ['junit', { outputFile: './test-results/reports/junit.xml' }],
    ['allure-playwright', {
      outputFolder: './test-results/reports/allure-results',
      detail: true,
      suiteTitle: true,
      categories: [
        {
          name: 'Critical',
          matchedStatuses: ['failed', 'broken']
        },
        {
          name: 'Flaky',
          matchedStatuses: ['passed'],
          messageRegex: '.*retry.*'
        }
      ]
    }],
    ['./tests/e2e/reporters/linear-reporter.js', {
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
  ],
});
