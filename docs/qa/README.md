# Military LMS — QA Knowledge Base

## Purpose
This folder is the central knowledge base for all QA, testing, and bug documentation for the Military LMS project. It serves as documentation that doubles as test case code — every spec file documents expected behavior.

## Structure

```
docs/qa/
├── README.md                      — This file (index)
├── TEST_MATRIX.md                 — Master test matrix (40 modules, ~640 test cases)
├── PLAYWRIGHT_TEST_PROMPT.md      — Reusable prompt for generating Playwright tests
├── CHAT_QA_REPORT.md              — Chat module QA report
├── BUG_REGISTRY.md                — All bugs found, their Linear IDs, and status
├── modules/                       — Per-module documentation
│   ├── auth.md
│   ├── programs.md
│   ├── subjects.md
│   ├── classes.md
│   ├── enrollments.md
│   ├── activities.md
│   ├── resources.md
│   ├── announcements.md
│   ├── quizzes.md
│   ├── attendance.md
│   ├── standup-attendance.md
│   ├── penalties.md
│   ├── participations.md
│   ├── behaviors.md
│   ├── marks.md
│   ├── chat.md
│   ├── notifications.md
│   ├── drive.md
│   ├── workflow.md
│   ├── scheduling.md
│   ├── classrooms.md
│   ├── admin-scopes.md
│   ├── dashboard.md
│   ├── lookup.md
│   ├── users.md
│   ├── permissions.md
│   ├── i18n.md
│   └── rbac.md
└── runbooks/                      — Operational guides
    ├── RUNNING_TESTS.md
    ├── BUG_REPORTING_WORKFLOW.md
    └── LINEAR_LABEL_GUIDE.md
```

## How to Use

### For QA Engineers
1. Read `TEST_MATRIX.md` for the full test case list
2. Use `PLAYWRIGHT_TEST_PROMPT.md` to generate new test specs
3. Check `BUG_REGISTRY.md` for known issues
4. Refer to `modules/{module}.md` for module-specific business rules and test context

### For Developers
1. Read `modules/{module}.md` to understand expected behavior
2. Check `BUG_REGISTRY.md` before fixing to avoid duplicates
3. Use test spec files in `client/tests/e2e/specs/` as living documentation

### For Project Managers
1. `TEST_MATRIX.md` gives coverage overview
2. `BUG_REGISTRY.md` tracks all discovered issues with Linear links
3. Linear labels: `module:*`, `role:*`, `priority:*`, `type:*`, `Bug`, `qa`

## Linear Label Scheme

| Category | Labels | Purpose |
|----------|--------|---------|
| Module | `module:auth`, `module:chat`, `module:drive`, ... | Which module the bug/test belongs to |
| Role | `role:admin`, `role:hr`, `role:instructor`, `role:student`, `role:super_admin` | Which user role triggers the bug |
| Priority | `priority:critical`, `priority:high`, `priority:medium`, `priority:low` | Business priority |
| Type | `type:api`, `type:ui`, `type:integration` | Test type |
| Category | `Bug`, `Feature`, `Improvement`, `qa` | Issue category |

## Test Spec Files as Documentation

Each Playwright spec file in `client/tests/e2e/specs/` serves as living documentation:
- **Test IDs** (`TC-{MODULE}-{NNN}`) map to the test matrix
- **Business context** comments explain why each test matters
- **RBAC tests** document which roles can/cannot access each endpoint
- **Security tests** document authentication requirements

## Running Tests

```bash
# All tests
cd client && npx playwright test --reporter=list

# Specific module
npx playwright test specs/attendance-api.spec.js

# With Allure report
npx playwright test && npx allure serve test-results/reports/allure-results
```
