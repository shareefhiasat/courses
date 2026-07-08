/**
 * Playwright Global Setup — runs before all tests
 * - Adds Allure labels/tags based on spec filename (API vs UI)
 * - Injects test type metadata into test results
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

// Load .env from repo root and client/ (Playwright is run from client/)
const cwd = process.cwd();
loadEnvFile(resolve(cwd, '.env'));
loadEnvFile(resolve(cwd, '..', '.env'));

export default async function globalSetup() {
  // Ensure allure-results directory has environment + categories
  // (allure-setup.js handles this, but in case tests are run without it)
  const allureResults = resolve(process.cwd(), 'allure-results');
  const configDir = resolve(process.cwd(), 'tests', 'e2e', 'config');

  // Copy environment.properties if missing
  const envProps = resolve(allureResults, 'environment.properties');
  if (!existsSync(envProps)) {
    const src = resolve(configDir, 'allure-environment.properties');
    if (existsSync(src)) {
      try {
        const { mkdirSync, copyFileSync } = await import('fs');
        mkdirSync(allureResults, { recursive: true });
        copyFileSync(src, envProps);
      } catch {}
    }
  }

  // Copy categories.json if missing
  const catFile = resolve(allureResults, 'categories.json');
  if (!existsSync(catFile)) {
    const src = resolve(configDir, 'allure-categories.json');
    if (existsSync(src)) {
      try {
        const { mkdirSync, copyFileSync } = await import('fs');
        mkdirSync(allureResults, { recursive: true });
        copyFileSync(src, catFile);
      } catch {}
    }
  }
}
