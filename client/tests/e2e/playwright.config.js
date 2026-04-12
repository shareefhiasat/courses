// Playwright configuration for E2E tests
import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './config/constants.js';

export default defineConfig({
  testDir: './specs',
  timeout: 60 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  outputDir: '../../test-results',
  reporter: [
    ['html', { outputFolder: '../../test-results/reports/html', open: 'never' }],
    ['list'],
    ['json', { outputFile: '../../test-results/reports/results.json' }],
    ['junit', { outputFile: '../../test-results/reports/junit.xml' }],
    // Allure reporter for beautiful test reports
    ['allure-playwright', { 
      outputFolder: '../../test-results/reports/allure-results',
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
    }]
  ],
  use: {
    baseURL: BASE_URL,
    headless: process.env.CI ? true : true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
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
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },
});
