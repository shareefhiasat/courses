# Military LMS — Playwright Test Generation Master Prompt

## Purpose
Use this prompt to generate comprehensive Playwright E2E test cases for any module in the Military LMS project.

---

## The Prompt

```
You are a QA engineer working on the Military LMS project. Generate comprehensive Playwright E2E test cases for the [MODULE_NAME] module.

### Context
- Backend: Node.js/Express at http://localhost:8001, API prefix: /api/v1/
- Frontend: React at https://localhost:5174
- Auth: Keycloak SSO (token-based)
- Test framework: Playwright with @playwright/test
- Test directory: client/tests/e2e/specs/
- Config: client/tests/e2e/config/test.config.js
- API helpers: client/tests/e2e/utils/api-helpers.js
- Test data: client/tests/e2e/fixtures/test-data.js

### Test Configuration
- Test users: superAdmin (shareef.hiasat@gmail.com), admin, instructor, student
- Keycloak realm: military-lms
- API base: http://localhost:8001/api/v1

### Requirements
1. Generate BOTH API and UI test cases for the module
2. API tests use fetch() with auth tokens from Keycloak
3. UI tests use Playwright page object model with Keycloak login
4. Cover: CRUD operations, validation, pagination, filtering, RBAC, edge cases
5. Test IDs: TC-{MODULE}-{NNN} format
6. Each test should have clear assertions
7. Use test.describe blocks for grouping
8. Include security tests (unauthenticated access returns 401)
9. Include RBAC tests (wrong role returns 403)
10. Skip tests gracefully when prerequisites don't exist

### API Routes to Test
[List the API routes for the module here]

### UI Pages to Test
[List the UI pages for the module here]

### Test Matrix Reference
See: docs/qa/TEST_MATRIX.md for the full test case list

### Output Format
Generate a single .spec.js file with:
- Import statements
- test.describe blocks
- Individual test() cases with TC-IDs
- Clear assertions (expect)
- Error handling (test.skip when data doesn't exist)

### Linear Issue Creation
If you find a bug during testing:
1. Create a Linear issue with title: "[MODULE] Brief description"
2. Labels: Bug, module:{name}, priority:{level}
3. Description: Steps to reproduce, expected vs actual behavior
4. Do NOT fix the bug — only report it
```

---

## Module-Specific Quick Prompts

### Chat Module
```
Generate Playwright tests for the Chat module (module:chat).
API routes: GET /chat/rooms, GET /chat/rooms/:roomId/messages, POST /chat/rooms/:roomId/messages,
PUT /chat/messages/:messageId, DELETE /chat/messages/:messageId, POST /chat/dm,
POST /chat/messages/:messageId/reactions, POST /chat/messages/:messageId/vote, GET /chat/users
UI page: /chat (ChatPage.jsx)
Test IDs: TC-CHAT-001 through TC-CHAT-030
Special cases: WebSocket real-time updates, poll voting, file attachments (25MB limit), DM creation, reactions
```

### Smart Drive Module
```
Generate Playwright tests for the Smart Drive module (module:drive).
API routes: 40+ routes for files, folders, sharing, public links, comments, versions, WOPI
UI page: /smart-drive
Test IDs: TC-DRV-001 through TC-DRV-045
Special cases: Chunked upload (initiate+complete), Collabora editing, file versions, public links, ACL sharing
```

### Workflow Module
```
Generate Playwright tests for the Workflow module (module:workflow).
API routes: 35+ routes for documents, definitions, instances, approvals, comments
UI pages: /workflow/inbox, /workflow-documents/:id, /workflow/:id, /workflow/compliance, /workflow/analytics
Test IDs: TC-WF-001 through TC-WF-035
Special cases: Multi-stage approvals, document upload, compliance dashboard, analytics, my-tasks
```

### Scheduling Module
```
Generate Playwright tests for the Scheduling module.
Sub-modules: classrooms, time-slots, holidays, teacher-availability, schedule-sessions, scheduling-summary
API routes: 40+ routes across sub-modules
UI pages: /scheduling-calendar (with tabs)
Test IDs: TC-CLRM-*, TC-TS-*, TC-HOL-*, TC-TA-*, TC-SS-*, TC-SSUM-*
Special cases: Conflict detection, bulk session creation, classroom availability, teacher workload, PDF/Excel exports
```

---

## Workflow for Bug Reporting

1. **Run tests**: `cd client && npx playwright test --reporter=list`
2. **Identify failures**: Check test output and screenshots in test-results/
3. **Verify bug**: Manually reproduce the issue
4. **Create Linear issue**:
   - Title: `[MODULE] Brief bug description`
   - Labels: `Bug`, `module:{name}`, `priority:{level}`
   - Description:
     ```
     ## Bug Description
     [What happened]
     
     ## Steps to Reproduce
     1. [Step 1]
     2. [Step 2]
     
     ## Expected Behavior
     [What should happen]
     
     ## Actual Behavior
     [What actually happens]
     
     ## Test Case
     TC-{MODULE}-{NNN}
     
     ## Environment
     - Backend: localhost:8001
     - Frontend: localhost:5174
     - Browser: Chromium
     ```
5. **Do NOT fix** — only report

---

## Running the Tests

```bash
# Install dependencies (if not already)
cd client && npm install

# Run all tests
npx playwright test

# Run specific module
npx playwright test specs/chat-api.spec.js

# Run with UI
npx playwright test --ui

# Run with debug
npx playwright test --debug

# Generate Allure report
npx playwright test && npx allure serve test-results/reports/allure-results

# Run only API tests
npx playwright test --grep "API"

# Run only UI tests
npx playwright test --grep "UI"
```

---

## Test File Structure

```
client/tests/e2e/
├── config/
│   ├── constants.js          # Base URL, timeouts, selectors
│   └── test.config.js        # Test users, Keycloak config
├── fixtures/
│   ├── users.js              # Test user definitions
│   └── test-data.js          # Reusable test data for CRUD
├── utils/
│   ├── auth.js               # Login/logout helpers
│   └── api-helpers.js        # API request helpers with auth
├── pages/                    # Page Object Models
│   └── LoginPage.js
├── specs/                    # Test spec files
│   ├── auth.spec.js          # Authentication tests
│   ├── programs-api.spec.js  # Programs API tests
│   ├── programs-ui.spec.js   # Programs UI tests
│   ├── subjects-api.spec.js  # Subjects API tests
│   ├── classes-api.spec.js   # Classes API tests
│   ├── ... (one per module)
│   ├── chat-api.spec.js      # Chat API tests
│   ├── chat-ui.spec.js       # Chat UI tests
│   ├── drive-api.spec.js     # Smart Drive API tests
│   ├── workflow-api.spec.js  # Workflow API tests
│   ├── rbac-api.spec.js      # RBAC cross-cutting tests
│   └── misc-api.spec.js      # Misc module tests
└── playwright.config.js      # Playwright configuration
```

---

## Linear Label Reference

| Label Type | Examples |
|------------|----------|
| Module | `module:chat`, `module:drive`, `module:workflow` |
| Type | `type:api`, `type:ui`, `type:integration` |
| Priority | `priority:critical`, `priority:high`, `priority:medium`, `priority:low` |
| Category | `Bug`, `Feature`, `Improvement`, `qa` |
