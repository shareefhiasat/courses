/**
 * Allure Setup — runs before tests to prepare allure-results directory
 * Copies environment.properties and categories.json into allure-results/
 * so Allure dashboard shows environment info and proper categories.
 */
import { mkdirSync, copyFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

const ROOT = resolve(process.cwd());
const ALLURE_RESULTS = join(ROOT, 'allure-results');
const CONFIG_DIR = join(ROOT, 'tests', 'e2e', 'config');

// Ensure allure-results directory exists
mkdirSync(ALLURE_RESULTS, { recursive: true });

// Copy environment.properties
const envFile = join(CONFIG_DIR, 'allure-environment.properties');
if (existsSync(envFile)) {
  copyFileSync(envFile, join(ALLURE_RESULTS, 'environment.properties'));
  console.log('[allure-setup] Copied environment.properties');
}

// Copy categories.json
const catFile = join(CONFIG_DIR, 'allure-categories.json');
if (existsSync(catFile)) {
  copyFileSync(catFile, join(ALLURE_RESULTS, 'categories.json'));
  console.log('[allure-setup] Copied categories.json');
}

// Write executor.json with build info
const executor = {
  reportName: 'lms-e2e',
  buildName: `dev-${new Date().toISOString().split('T')[0]}`,
  buildOrder: Date.now(),
  name: 'Playwright E2E',
  reportUrl: 'http://localhost:5050/allure-docker-service/projects/lms-e2e/reports/latest/index.html',
  buildUrl: '',
  type: 'playwright',
};
writeFileSync(join(ALLURE_RESULTS, 'executor.json'), JSON.stringify(executor, null, 2));
console.log('[allure-setup] Wrote executor.json');

export {};
