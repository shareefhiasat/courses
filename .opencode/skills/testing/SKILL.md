# Testing Skill

## Description
Testing practices for the Military LMS — unit, integration, E2E, and reporting.

## Test Configuration
Check `client/package.json` for test scripts and framework. Common patterns:
- Vitest or Jest for unit/integration tests
- Playwright or Cypress for E2E tests
- Allure for reporting

## Operations

### Run All Tests
```bash
cd client && npm test
# or
cd client && npx vitest run
```

### Run Tests in Watch Mode
```bash
cd client && npx vitest
```

### Run Specific Test File
```bash
cd client && npx vitest run src/components/__tests__/ComponentName.test.tsx
```

### Run Tests with Coverage
```bash
cd client && npx vitest run --coverage
```

### Generate Allure Report
```bash
# Ensure allure-results directory exists with results
allure generate allure-results -o allure-report --clean
allure open allure-report
```

### Test API Endpoints
```bash
curl -s http://localhost:8001/api/v1/health
curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Check Test Data in Database
```bash
docker exec lms-qaf-app-db psql -U military_lms -d military_lms -c "SELECT COUNT(*) FROM users;"
docker exec lms-qaf-app-db psql -U military_lms -d military_lms -c "SELECT COUNT(*) FROM enrollments;"
```

## Test Writing Guidelines
1. Test the behavior, not the implementation
2. Use descriptive test names (what + expected outcome)
3. One assertion concept per test
4. Mock external services (Keycloak, MinIO, Redis)
5. Clean up test data after tests complete
6. Use factories/fixtures for test data (check for existing patterns)
7. Test error states and edge cases, not just happy path

## Troubleshooting
- **Tests fail with auth errors:** mock the Keycloak adapter
- **Tests fail with DB errors:** use test database or in-memory SQLite
- **Tests timeout:** check for async issues, increase timeout
- **Allure empty:** verify `@allure` annotations are present
