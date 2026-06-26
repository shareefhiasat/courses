# Bug Registry — Military LMS

All bugs discovered during QA testing. Linked to Linear issues.

## Active Bugs

| Linear ID | Title | Module | Role | Priority | Status | Test Case |
|-----------|-------|--------|------|----------|--------|-----------|
| [SHA-16](https://linear.app/shareef/issue/SHA-16) | requireSuperAdmin commented out on GET /users | users, rbac | student, admin, instructor | **Critical** | Backlog | TC-RBAC-011 |
| [SHA-17](https://linear.app/shareef/issue/SHA-17) | Program-level admin scope not applied to chat rooms | chat, rbac | admin, hr | Medium | Backlog | TC-CHAT-003 |
| [SHA-18](https://linear.app/shareef/issue/SHA-18) | Stack trace exposed in error responses | drive | admin, instructor, student | Medium | Backlog | TC-DRV-* |
| [SHA-19](https://linear.app/shareef/issue/SHA-19) | Duplicate router.get('/class-stats') route | participations | — | Low | Backlog | TC-PAR-003 |
| [SHA-20](https://linear.app/shareef/issue/SHA-20) | Duplicate router.get('/me') route definition | users | — | Low | Backlog | TC-USR-005 |

## Previously Found Bugs (from chat QA session)

| Linear ID | Title | Module | Priority | Status |
|-----------|-------|--------|----------|--------|
| SHA-10 | Missing Arabic translations in chat | i18n, chat | Medium | Backlog |
| SHA-11 | Notification bell only shows for super_admin | notifications | Medium | Backlog |
| SHA-13 | Chat favorite/star feature is a stub | chat | Low | Backlog |
| SHA-15 | Admin scope not applied to chat rooms | chat, rbac | Medium | Backlog |

## Bug Reporting Workflow

1. **Run tests**: `cd client && npx playwright test --reporter=list`
2. **Identify failure**: Check output + screenshots in `test-results/`
3. **Verify bug**: Manually reproduce
4. **Create Linear issue** with:
   - Title: `[MODULE] Brief description`
   - Labels: `Bug`, `module:{name}`, `role:{name}`, `priority:{level}`
   - Description: Steps, expected vs actual, test case ID
5. **Add to this registry**: Add row to the Active Bugs table
6. **Do NOT fix** — only report (baseline phase)

## Priority Guidelines

| Priority | Criteria |
|----------|----------|
| Critical | Security breach, data leak, system unusable |
| High | Core business flow broken, no workaround |
| Medium | Feature broken but workaround exists |
| Low | Cosmetic, code quality, minor inconvenience |
