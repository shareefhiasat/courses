# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: attendance-ui.spec.js >> Attendance UI — Mode Toggle (Regular vs Standup) >> TC-ATT-UI-012: Switch back to regular mode restores class selection
- Location: tests/e2e/specs/attendance-ui.spec.js:245:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://localhost:5174/attendance", waiting until "load"

```

```
Tearing down "context" exceeded the test timeout of 60000ms.
```