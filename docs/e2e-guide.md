# End-to-End (E2E) Testing Guide

- Purpose: Validate critical user flows (e.g., sign-in) in a real browser.
- Framework: Playwright (recommended for web apps).
- Credentials: Use environment variables to avoid committing secrets.

Directory structure:
- tests/e2e/
- docs/

How to run locally:
- Ensure dependencies installed: npm install
- Create a .env file (not committed) with:
  BASE_URL=http://your-app-url
  TEST_USERNAME=your-user@example.com
  TEST_PASSWORD=your-password
- Run tests: npx playwright test

Notes:
- Use storageState.json to persist login across tests if needed.
- Adapt selectors in login.spec.js to match your login form.
- Extend tests to cover additional scenarios (e.g., failed login, 2FA).

Search tips (Ctrl+K in docs site):
- Sign-in tests
- E2E framework
- Playwright configuration


- Purpose: Validate critical user flows (e.g., sign-in) in a real browser.
- Framework: Playwright (recommended for web apps).
- Credentials: Use environment variables to avoid committing secrets.

Directory structure:
- tests/e2e/
- docs/

How to run locally:
- Ensure dependencies installed: npm install
- Create a .env file (not committed) with:
  BASE_URL=http://your-app-url
  TEST_USERNAME=your-user@example.com
  TEST_PASSWORD=your-password
- Run tests: npx playwright test

Notes:
- Use storageState.json to persist login across tests if needed.
- Adapt selectors in login.spec.js to match your login form.
- Extend tests to cover additional scenarios (e.g., failed login, 2FA).

Search tips (Ctrl+K in docs site):
- Sign-in tests
- E2E framework
- Playwright configuration


