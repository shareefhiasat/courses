# Running Tests — Runbook

## Prerequisites

1. **Docker services running**:
   ```bash
   docker ps  # Verify lms-qaf-app-db, lms-qaf-keycloak, lms-qaf-minio, lms-qaf-redis
   ```

2. **Backend running**:
   ```bash
   node backend/server.js
   ```

3. **Frontend running**:
   ```bash
   cd client && node node_modules/vite/bin/vite.js --host
   ```

4. **Playwright installed**:
   ```bash
   cd client && npm install
   npx playwright install chromium
   ```

## Running Tests

### All tests
```bash
cd client
npx playwright test --reporter=list
```

### Specific module
```bash
npx playwright test specs/attendance-api.spec.js
npx playwright test specs/chat-api.spec.js
```

### By tag/grep
```bash
# Only API tests
npx playwright test --grep "API"

# Only RBAC tests
npx playwright test --grep "RBAC"

# Only security tests
npx playwright test --grep "SEC"
```

### UI mode (interactive)
```bash
npx playwright test --ui
```

### Debug mode
```bash
npx playwright test --debug
```

### With specific browser
```bash
npx playwright test --project=chromium
```

## Reports

### HTML report
```bash
npx playwright show-report test-results/reports/html
```

### Allure report
```bash
npx playwright test
npx allure serve test-results/reports/allure-results
```

### JUnit (for CI)
```bash
# Results at test-results/reports/junit.xml
npx playwright test --reporter=junit
```

## Test Data

- Test data fixtures: `client/tests/e2e/fixtures/test-data.js`
- All test data uses `E2E-` prefix for easy identification
- Tests auto-skip when prerequisite data doesn't exist
- CRUD tests create and clean up their own data

## Troubleshooting

### Tests fail with 401
- Verify backend is running on port 8001
- Verify Keycloak is running on port 8080
- Check test config: `client/tests/e2e/config/test.config.js`

### Tests fail with connection refused
- Verify frontend is running on port 5174
- Check `BASE_URL` in `client/tests/e2e/config/constants.js`

### Tests timeout
- Increase timeout in `playwright.config.js`
- Check if Docker services are healthy
