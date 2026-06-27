# E2E Test Guide

## Where to Run Tests From

All commands run from the `client/` directory:

```bash
cd client
```

## Test Commands

### Run All Tests
```bash
# Run all tests
pnpm test

# Run all tests + generate Allure report
pnpm test:allure

# Run specific spec
npx playwright test --config=tests/e2e/playwright.config.js specs/programs-api.spec.js

# Run with visible browser
HEADED=1 pnpm test

# Run with UI mode (interactive)
npx playwright test --config=tests/e2e/playwright.config.js --ui
```

### Run Per-Module (with Allure + Linear reporter)
Each command runs the module's API + UI specs and generates an Allure report:

```bash
pnpm run test:allure:auth           # Authentication
pnpm run test:allure:activities     # Activities (API + UI)
pnpm run test:allure:announcements  # Announcements (API + UI)
pnpm run test:allure:attendance     # Attendance (API + UI)
pnpm run test:allure:chat           # Chat (API + UI)
pnpm run test:allure:classes        # Classes (API + UI)
pnpm run test:allure:dashboard      # Dashboard (UI)
pnpm run test:allure:drive          # Drive/File Manager (API + UI)
pnpm run test:allure:enrollments    # Enrollments (API + UI)
pnpm run test:allure:marks          # Marks/Grades (API + UI)
pnpm run test:allure:notifications  # Notifications (API + UI)
pnpm run test:allure:penalties      # Penalties (API + UI)
pnpm run test:allure:programs       # Programs (API + UI)
pnpm run test:allure:quizzes        # Quizzes (API + UI)
pnpm run test:allure:resources      # Resources & Participations (API + UI)
pnpm run test:allure:scheduling     # Scheduling (API + UI)
pnpm run test:allure:subjects       # Subjects (API + UI)
pnpm run test:allure:users          # Users (API + UI)
pnpm run test:allure:workflow       # Workflow (API + UI)
pnpm run test:allure:rbac           # RBAC / Roles (API)
pnpm run test:allure:analytics      # Analytics (UI)
pnpm run test:allure:profile        # Profile (UI)
pnpm run test:allure:global         # Global pages, Home, Misc routes (UI)
pnpm run test:allure:ui-misc        # Dark mode, Arabic/RTL (UI)
```

## Allure Docker Dashboard (Persistent)

The Allure service is part of `docker-compose.dev.yml` (container: `lms-qaf-allure`).

### Start / Stop
```bash
# Start Allure Docker dashboard
pnpm test:allure:docker

# Stop Allure container
pnpm test:allure:docker:down
```

### Send Results & View
```bash
# 1. Run tests (generates allure-results)
pnpm test:allure

# 2. Send results to Allure Docker server
pnpm test:allure:send

# 3. Open dashboard in browser
pnpm test:allure:open
# URL: http://localhost:5050/allure-docker-service/projects/lms-e2e/reports/latest/index.html
```

### How It Works
- `allure-setup.js` runs first — copies `environment.properties` and `categories.json` into `allure-results/`
- Playwright outputs Allure results to `./allure-results/` (via allure-playwright)
- `allure-enricher.js` runs after tests — adds labels (API/UI, module), tags, business story descriptions, and Linear links
- The `lms-qaf-allure` Docker container mounts this directory as a volume
- The container auto-detects new results every 3 seconds and regenerates the report
- History is kept (KEEP_HISTORY=1) with persistent Docker volumes
- Use `pnpm test:allure:send` to manually push results to the Allure server

### What You'll See in Allure Dashboard
- **Environment tab**: Development env, URLs, framework info
- **Categories tab**: Critical Failures, Skipped (No Data), Skipped (Test User Creation Failed), Flaky Tests
- **Tags**: API, UI, module name, test case ID (e.g., TC-AUTH-024)
- **Description**: Business story for each module
- **Links**: Direct link to Linear issue for each test case ID

## Skipped Tests — "Unable to create test user"

Some older `.test.js` files (e.g., `announcements-api.test.js`, `enrollments-api.test.js`) try to create test users via `POST /api/v1/users` and skip when that fails. This happens because:

1. The API endpoint requires specific scopes/permissions that may not be configured
2. The user creation payload may be incomplete for the current schema

These `.test.js` files are **legacy** and superseded by the newer `.spec.js` files. The `.spec.js` files use pre-configured test users from `test.config.js` instead of creating users on the fly.

**To distinguish in Allure**: The categories tab groups these as "Skipped — Test User Creation Failed".

## Distinguishing API vs UI Tests

In the Allure dashboard:
- **Tags** column shows `API` or `UI` (and the module name)
- **testType** label filters by API/UI
- **module** label filters by module (auth, activities, etc.)
- File naming convention: `*-api.spec.js` = API tests, `*-ui.spec.js` = UI tests

## Linear Integration (Test Failure Reporting)

The custom Playwright→Linear reporter automatically creates or updates Linear issues when tests fail.

### Setup
The `LINEAR_API_KEY` should be set in `client/.env`:
```
LINEAR_API_KEY=your_linear_api_key_here
```

The reporter is enabled in `playwright.config.js` with `dryRun: false`.

### What It Does
- On test failure, extracts the test case ID (e.g., `TC-PROG-006`) from the test title
- Searches Linear for an existing issue with that test case ID
- If found: adds a comment with the latest failure details
- If not found: creates a new issue in team `SHA` with labels `qa` and `bug`
- Includes: error message, stack trace, screenshot path, Allure report link
- Writes a summary file to `test-results/reports/linear-failures.json`

### Configuration
To disable issue creation (dry-run mode), set `dryRun: true` in `playwright.config.js`:
```js
['./reporters/linear-reporter.js', {
  teamKey: 'SHA',
  labels: ['qa', 'bug'],
  allureUrl: 'http://localhost:5050',
  dryRun: true,  // Set false to create/update Linear issues
}]
```

## Test Cleanup

### CRUD Lifecycle Pattern
Tests that create data follow a serial create → edit → delete lifecycle:
- **API tests** (`programs-api.spec.js`): `test.describe.serial` with `afterAll` cleanup
- **UI tests** (`penalties-ui.spec.js`, `activities-ui.spec.js`): `test.describe.serial` with `afterAll` cleanup

### Cleanup Helpers
`tests/e2e/utils/cleanup-helpers.js` provides API-based cleanup:
- `cleanupByPrefix(endpoint, searchField)` — deletes all E2E-prefixed entities
- `cleanupById(endpoint, id)` — deletes a specific entity by ID
- `cleanupAll(targets)` — bulk cleanup across multiple endpoints

All test-created entities use the `E2E` prefix for identification.

## Test Credentials

Configured in `tests/e2e/config/test.config.js`:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | shareef.hiasat@gmail.com | Jordan123$ |
| Admin | admin1 | Test123$ |
| Instructor | instructor1 | Test123$ |
| Student | student1 | Test123$ |
| HR | hr1 | hr123 |

Override via environment variables:
```bash
TEST_SUPER_ADMIN_EMAIL=custom@email.com
TEST_SUPER_ADMIN_PASSWORD=custompass
```

## Test Files Overview

### API Tests (`*-api.spec.js`)
- Direct API calls via `apiRequest()` helper
- Authenticated through Keycloak token endpoint
- Fast execution (no browser)

### UI Tests (`*-ui.spec.js`)
- Browser automation via Playwright
- Full user experience testing
- Uses `gotoWithAuth()` for authenticated navigation

### Utilities
- `utils/ui-helpers.js` — Login, navigation, content waiting
- `utils/api-helpers.js` — Auth tokens, API requests
- `utils/cleanup-helpers.js` — Post-test data cleanup
- `utils/crud-helpers.js` — Form fill, submit, verify patterns
- `reporters/linear-reporter.js` — Linear issue creation on failure

## Viewing Reports

### Playwright HTML Report
```bash
# Open HTML report
open test-results/reports/html/index.html
```

### Allure Docker Dashboard
```bash
pnpm test:allure:open
# http://localhost:5050/allure-docker-service/projects/lms-e2e/reports/latest/index.html
```

### JSON / JUnit Results
- `test-results/reports/results.json`
- `test-results/reports/junit.xml`
- `test-results/reports/linear-failures.json`

## Prerequisites

1. Docker containers running (app-db, keycloak, minio, redis)
2. Backend running on port 8001
3. Frontend running on port 5174 (HTTPS)
4. For Allure Docker: `pnpm test:allure:docker`
5. For Linear: API key in `client/.env`

## Quick Start

```bash
# 1. Start Allure dashboard
pnpm test:allure:docker

# 2. Run a specific module (e.g., auth)
pnpm run test:allure:auth

# 3. Send results to Allure server
pnpm test:allure:send

# 4. Open dashboard
pnpm test:allure:open

# Or run everything at once
pnpm test:allure && pnpm test:allure:send && pnpm test:allure:open
```
