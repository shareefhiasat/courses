# Bug Reporting Workflow — Runbook

## Overview
During the baseline testing phase, we **report bugs only** — no fixes. This ensures a stable baseline for retesting.

## Workflow

### Step 1: Run Tests
```bash
cd client && npx playwright test --reporter=list
```

### Step 2: Identify Failures
- Check console output for failed test names
- Review screenshots in `test-results/`
- Review video recordings for UI tests
- Check trace files: `npx playwright show-trace test-results/{test-name}/trace.zip`

### Step 3: Verify the Bug
- Manually reproduce the issue in the browser
- Confirm it's a real bug, not a test issue
- Check if it's already in `BUG_REGISTRY.md`

### Step 4: Create Linear Issue

**Title format**: `[MODULE] Brief description`

**Labels** (select all that apply):
- `Bug` (always)
- `module:{name}` — which module (e.g., `module:chat`)
- `role:{name}` — which role triggers it (e.g., `role:student`)
- `priority:{level}` — business priority

**Description template**:
```markdown
## Bug Description
[What happened]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Test Case
TC-{MODULE}-{NNN}

## Role
[Which user role triggers the bug]

## Environment
- Backend: localhost:8001
- Frontend: localhost:5174
- Browser: Chromium

## Screenshots
[Attach if available]
```

### Step 5: Update Bug Registry
Add the new bug to `docs/qa/BUG_REGISTRY.md` in the Active Bugs table.

### Step 6: Do NOT Fix
- This is a baseline phase
- Document only
- Fixes will be triaged and assigned separately

## Priority Assignment Guide

| Priority | When to Use |
|----------|-------------|
| `priority:critical` | Security breach, PII exposure, data loss, system unusable |
| `priority:high` | Core business flow broken (enrollment, attendance, grades), no workaround |
| `priority:medium` | Feature broken but workaround exists, UX issue |
| `priority:low` | Cosmetic, code quality, duplicate code, minor inconvenience |

## Role Label Guide

| Label | When to Use |
|-------|-------------|
| `role:super_admin` | Bug only manifests when super_admin is logged in |
| `role:admin` | Bug only manifests when admin is logged in |
| `role:hr` | Bug only manifests when HR is logged in |
| `role:instructor` | Bug only manifests when instructor is logged in |
| `role:student` | Bug only manifests when student is logged in |

Multiple role labels can be applied if the bug affects multiple roles.
